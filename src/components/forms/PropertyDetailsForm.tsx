
'use client'


import { useState, useRef, useEffect } from 'react'
// Google Maps JavaScript SDK Autocomplete integration
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

import { PropertyAnalysisInput, PROPERTY_TYPES, PROPERTY_CONDITIONS, RoomRental, RENTAL_STRATEGIES } from '@/types/property'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// TypeScript: declare window.google for Google Maps JS SDK
declare global {
  interface Window {
    google: any;
  }
}

// Helper: format integer with commas (e.g., 1434 -> 1,434)
function formatInteger(value: string | number) {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseInt(value.replace(/[^\d\-]/g, '')) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US');
}

// Helper: format number as currency string with commas and 2 decimals
function formatCurrency(value: string | number) {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.\-]/g, '')) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Helper: remove formatting to get raw number string
function unformatCurrency(value: string) {
  return value.replace(/[^\d.\-]/g, '');
}

interface PropertyDetailsFormProps {
  data: Partial<PropertyAnalysisInput>
  onUpdate: (data: Partial<PropertyAnalysisInput>) => void
  onNext: () => void
}

export function PropertyDetailsForm({ data, onUpdate, onNext }: PropertyDetailsFormProps) {

  const [formData, setFormData] = useState({
    address: data.address || '',
    propertyType: data.propertyType || 'Single Family',
    purchasePrice: data.purchasePrice || '',
    currentValue: data.currentValue || '',
    squareFootage: data.squareFootage || '',
    lotSize: data.lotSize || '',
    yearBuilt: data.yearBuilt || '',
    bedrooms: data.bedrooms || '',
    bathrooms: data.bathrooms || '',
    condition: data.condition || 'Good',
    imageUrl: data.imageUrl || '',
    rentalStrategy: data.rentalStrategy || 'entire-house',
    rentableRooms: data.rentableRooms || [],
    grossRent: data.grossRent || '',
    // Expense fields for persistence
    propertyTaxes: data.propertyTaxes || '',
    insurance: data.insurance || '',
    propertyMgmt: data.propertyMgmt || '',
    maintenance: data.maintenance || '',
    utilities: data.utilities || '',
    hoaFees: data.hoaFees || '',
    equipment: data.equipment || '',
    rehabCosts: data.rehabCosts || '',
  });
  // Room rental state
  const [numRoomsToRent, setNumRoomsToRent] = useState<number>(formData.rentableRooms?.length || 0);
  const [roomRates, setRoomRates] = useState<number[]>(formData.rentableRooms?.map((r: any) => r.weeklyRate) || []);
  const [roomValidationError, setRoomValidationError] = useState<string>('');

  // Calculate total monthly rent from room rates
  const totalMonthlyRoomRent = roomRates.reduce((sum, rate) => sum + (Number(rate) || 0), 0) * 4;


  const [imageUrl, setImageUrl] = useState<string | null>(data.imageUrl || null);
  const [imageLoading, setImageLoading] = useState(false);


  // Autocomplete state (JS SDK)
  const [suggestions, setSuggestions] = useState<Array<{ description: string; place_id: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const googleMapsScriptLoaded = useRef(false);

  // Load Google Maps JS SDK if not already loaded
  useEffect(() => {
    if (typeof window === 'undefined' || googleMapsScriptLoaded.current) return;
    if (window.google && window.google.maps && window.google.maps.places) {
      googleMapsScriptLoaded.current = true;
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      googleMapsScriptLoaded.current = true;
    };
    document.body.appendChild(script);
  }, []);

  // Handle address input change with JS SDK autocomplete
  const handleAddressInputChange = (value: string) => {
    handleChange('address', value);
    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setAutocompleteLoading(true);
    // Wait for Google Maps JS SDK to load
    const pollForService = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        if (!autocompleteServiceRef.current) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        }
        autocompleteServiceRef.current.getPlacePredictions(
          { input: value, types: ['address'] },
          (predictions: any[], status: string) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(predictions);
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
              setShowSuggestions(false);
            }
            setAutocompleteLoading(false);
          }
        );
      } else {
        setTimeout(pollForService, 100);
      }
    };
    pollForService();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: { description: string; place_id: string }) => {
    setFormData((prev) => ({ ...prev, address: suggestion.description }));
    setSuggestions([]);
    setShowSuggestions(false);
    handleChange('address', suggestion.description);
  };

  // Hide suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  // Fetch property image when address loses focus
  const handleAddressBlur = async () => {
    if (formData.address && formData.address.trim().length > 5) {
      setImageLoading(true);
      try {
        const resp = await fetch('/api/property-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: formData.address }),
        });
        const dataResp = await resp.json();
        setImageUrl(dataResp.imageUrl);
        setFormData((prev) => {
          const updated = { ...prev, imageUrl: dataResp.imageUrl };
          // Convert string fields to numbers where needed for onUpdate
          const processedData: Partial<PropertyAnalysisInput> = {
            ...updated,
            purchasePrice: updated.purchasePrice !== '' ? Number(unformatCurrency(updated.purchasePrice.toString())) : undefined,
            currentValue: updated.currentValue !== '' ? Number(unformatCurrency(updated.currentValue.toString())) : undefined,
            squareFootage: updated.squareFootage !== '' ? Number(unformatCurrency(updated.squareFootage.toString())) : undefined,
            lotSize: updated.lotSize !== '' ? Number(updated.lotSize) : undefined,
            yearBuilt: updated.yearBuilt !== '' ? Number(updated.yearBuilt) : undefined,
            bedrooms: updated.bedrooms !== '' ? Number(updated.bedrooms) : undefined,
            bathrooms: updated.bathrooms !== '' ? Number(updated.bathrooms) : undefined,
            grossRent: updated.grossRent !== '' && updated.grossRent !== undefined ? Number(unformatCurrency(updated.grossRent.toString())) : undefined,
            propertyTaxes: updated.propertyTaxes !== '' ? Number(updated.propertyTaxes) : undefined,
            insurance: updated.insurance !== '' ? Number(updated.insurance) : undefined,
            propertyMgmt: updated.propertyMgmt !== '' ? Number(updated.propertyMgmt) : undefined,
            maintenance: updated.maintenance !== '' ? Number(updated.maintenance) : undefined,
            utilities: updated.utilities !== '' ? Number(updated.utilities) : undefined,
            hoaFees: updated.hoaFees !== '' ? Number(updated.hoaFees) : undefined,
            equipment: updated.equipment !== '' ? Number(updated.equipment) : undefined,
            rehabCosts: updated.rehabCosts !== '' ? Number(updated.rehabCosts) : undefined
          };
          onUpdate(processedData);
          return updated;
        });
      } catch (e) {
        setImageUrl(null);
        setFormData((prev) => {
          const updated = { ...prev, imageUrl: '' };
          const processedData: Partial<PropertyAnalysisInput> = {
            ...updated,
            purchasePrice: updated.purchasePrice !== '' ? Number(unformatCurrency(updated.purchasePrice.toString())) : undefined,
            currentValue: updated.currentValue !== '' ? Number(unformatCurrency(updated.currentValue.toString())) : undefined,
            squareFootage: updated.squareFootage !== '' ? Number(unformatCurrency(updated.squareFootage.toString())) : undefined,
            lotSize: updated.lotSize !== '' ? Number(updated.lotSize) : undefined,
            yearBuilt: updated.yearBuilt !== '' ? Number(updated.yearBuilt) : undefined,
            bedrooms: updated.bedrooms !== '' ? Number(updated.bedrooms) : undefined,
            bathrooms: updated.bathrooms !== '' ? Number(updated.bathrooms) : undefined,
            grossRent: updated.grossRent !== '' && updated.grossRent !== undefined ? Number(unformatCurrency(updated.grossRent.toString())) : undefined,
            propertyTaxes: updated.propertyTaxes !== '' ? Number(updated.propertyTaxes) : undefined,
            insurance: updated.insurance !== '' ? Number(updated.insurance) : undefined,
            propertyMgmt: updated.propertyMgmt !== '' ? Number(updated.propertyMgmt) : undefined,
            maintenance: updated.maintenance !== '' ? Number(updated.maintenance) : undefined,
            utilities: updated.utilities !== '' ? Number(updated.utilities) : undefined,
            hoaFees: updated.hoaFees !== '' ? Number(updated.hoaFees) : undefined,
            equipment: updated.equipment !== '' ? Number(updated.equipment) : undefined,
            rehabCosts: updated.rehabCosts !== '' ? Number(updated.rehabCosts) : undefined
          };
          onUpdate(processedData);
          return updated;
        });
      } finally {
        setImageLoading(false);
      }
    }
  };



  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Clear room validation error when bedrooms change
    if (field === 'bedrooms') {
      setRoomValidationError('');
    }
  };



  // Call onUpdate with properly typed data whenever formData changes
  useEffect(() => {
    const processedData: Partial<PropertyAnalysisInput> = {};
    if (formData.address && formData.address.trim()) {
      processedData.address = formData.address;
    }
    if (formData.propertyType) {
      processedData.propertyType = formData.propertyType;
    }
    if (formData.condition) {
      processedData.condition = formData.condition;
    }
    // Always include imageUrl, even if empty string
    processedData.imageUrl = formData.imageUrl ?? '';
    // Always include rental strategy
    processedData.rentalStrategy = formData.rentalStrategy;
    if (formData.purchasePrice && formData.purchasePrice !== '') {
      processedData.purchasePrice = Number(unformatCurrency(formData.purchasePrice.toString()));
    }
    if (formData.currentValue && formData.currentValue !== '') {
      processedData.currentValue = Number(unformatCurrency(formData.currentValue.toString()));
    }
    if (formData.squareFootage && formData.squareFootage !== '') {
      processedData.squareFootage = Number(unformatCurrency(formData.squareFootage.toString()));
    }
    if (formData.lotSize && formData.lotSize !== '') {
      processedData.lotSize = Number(formData.lotSize);
    }
    if (formData.yearBuilt && formData.yearBuilt !== '') {
      processedData.yearBuilt = Number(formData.yearBuilt);
    }
    if (formData.bedrooms && formData.bedrooms !== '') {
      processedData.bedrooms = Number(formData.bedrooms);
    }
    if (formData.bathrooms && formData.bathrooms !== '') {
      processedData.bathrooms = Number(formData.bathrooms);
    }
    if (formData.rentableRooms) {
      processedData.rentableRooms = formData.rentableRooms;
      // Calculate grossRent from room rates only if using room rental strategy
      if (formData.rentalStrategy === 'individual-rooms' && 
          Array.isArray(formData.rentableRooms) && 
          formData.rentableRooms.length > 0) {
        const totalMonthlyRoomRent = formData.rentableRooms.reduce((sum, r) => sum + (Number(r.weeklyRate) || 0), 0) * 4;
        processedData.grossRent = totalMonthlyRoomRent;
      }
    }
    
    // Handle grossRent for entire-house strategy
    if (formData.rentalStrategy === 'entire-house' && formData.grossRent && formData.grossRent !== '') {
      processedData.grossRent = Number(unformatCurrency(formData.grossRent.toString()));
    }
  // Add expense fields for persistence (convert to number)
  if (formData.propertyTaxes !== undefined) processedData.propertyTaxes = Number(formData.propertyTaxes) || 0;
  if (formData.insurance !== undefined) processedData.insurance = Number(formData.insurance) || 0;
  if (formData.propertyMgmt !== undefined) processedData.propertyMgmt = Number(formData.propertyMgmt) || 0;
  if (formData.maintenance !== undefined) processedData.maintenance = Number(formData.maintenance) || 0;
  if (formData.utilities !== undefined) processedData.utilities = Number(formData.utilities) || 0;
  if (formData.hoaFees !== undefined) processedData.hoaFees = Number(formData.hoaFees) || 0;
  if (formData.equipment !== undefined) processedData.equipment = Number(formData.equipment) || 0;
  if (formData.rehabCosts !== undefined) processedData.rehabCosts = Number(formData.rehabCosts) || 0;
    onUpdate(processedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // Handle number of rooms to rent change
  const handleNumRoomsChange = (value: number) => {
    const bedrooms = Number(formData.bedrooms) || 0;
    const validValue = Math.max(0, value);
    
    // Clear any existing error
    setRoomValidationError('');
    
    // Validate that rooms don't exceed bedrooms when bedrooms is specified
    if (bedrooms > 0 && validValue > bedrooms) {
      setRoomValidationError(`Cannot rent more rooms (${validValue}) than total bedrooms (${bedrooms})`);
      return;
    }
    
    setNumRoomsToRent(validValue);
    let newRates = [...roomRates];
    if (validValue > roomRates.length) {
      newRates = [...roomRates, ...Array(validValue - roomRates.length).fill(0)];
    } else if (validValue < roomRates.length) {
      newRates = newRates.slice(0, validValue);
    }
    setRoomRates(newRates);
    // Update formData and parent
    const updatedRooms = newRates.map((rate, idx) => ({ roomNumber: idx + 1, weeklyRate: Number(rate) || 0 }));
    setFormData((prev) => ({ ...prev, rentableRooms: updatedRooms }));
    handleChange('rentableRooms', updatedRooms);
  };

  // Track which input is focused for formatting
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Handle weekly rate change for a room
  const handleRoomRateChange = (idx: number, value: string) => {
    // Accept string, unformat to number
    const raw = unformatCurrency(value);
    const num = raw === '' ? 0 : parseFloat(raw);
    const newRates = [...roomRates];
    newRates[idx] = isNaN(num) ? 0 : num;
    setRoomRates(newRates);
    const updatedRooms = newRates.map((rate, i) => ({ roomNumber: i + 1, weeklyRate: Number(rate) || 0 }));
    setFormData((prev) => ({ ...prev, rentableRooms: updatedRooms }));
    // Only call onUpdate with rentableRooms if all rates are non-zero (positive)
    if (newRates.length > 0 && numRoomsToRent > 0 && newRates.every(rate => Number(rate) > 0)) {
      const processedData: Partial<PropertyAnalysisInput> = {
  address: formData.address,
  propertyType: formData.propertyType,
  condition: formData.condition,
  imageUrl: formData.imageUrl,
  purchasePrice: formData.purchasePrice !== '' ? Number(formData.purchasePrice) : undefined,
  currentValue: formData.currentValue !== '' ? Number(formData.currentValue) : undefined,
  squareFootage: formData.squareFootage !== '' ? Number(formData.squareFootage) : undefined,
  lotSize: formData.lotSize !== '' ? Number(formData.lotSize) : undefined,
  yearBuilt: formData.yearBuilt !== '' ? Number(formData.yearBuilt) : undefined,
  bedrooms: formData.bedrooms !== '' ? Number(formData.bedrooms) : undefined,
  bathrooms: formData.bathrooms !== '' ? Number(formData.bathrooms) : undefined,
  rentableRooms: newRates.map((rate, idx) => ({ roomNumber: idx + 1, weeklyRate: Number(rate) })),
  propertyTaxes: formData.propertyTaxes !== '' ? Number(formData.propertyTaxes) : undefined,
  insurance: formData.insurance !== '' ? Number(formData.insurance) : undefined,
  propertyMgmt: formData.propertyMgmt !== '' ? Number(formData.propertyMgmt) : undefined,
  maintenance: formData.maintenance !== '' ? Number(formData.maintenance) : undefined,
  utilities: formData.utilities !== '' ? Number(formData.utilities) : undefined,
  hoaFees: formData.hoaFees !== '' ? Number(formData.hoaFees) : undefined,
  equipment: formData.equipment !== '' ? Number(formData.equipment) : undefined,
  rehabCosts: formData.rehabCosts !== '' ? Number(formData.rehabCosts) : undefined
      };
      onUpdate(processedData);
    }
  };

  const isValid = () => {
    return (
      formData.address.length >= 5 &&
      formData.propertyType &&
      formData.purchasePrice &&
      Number(unformatCurrency(formData.purchasePrice.toString())) > 1000
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
          <CardDescription>
            Enter basic information about the investment property
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address */}
          <div ref={autocompleteRef} className="relative">
            <Label htmlFor="address">Property Address *</Label>
            <Input
              id="address"
              type="text"
              placeholder="123 Main Street, City, State ZIP"
              value={formData.address}
              onChange={(e) => handleAddressInputChange(e.target.value)}
              onBlur={handleAddressBlur}
              autoComplete="off"
              className="mt-1"
            />
            {autocompleteLoading && <div className="text-xs text-gray-500 mt-1">Searching addresses...</div>}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-300 rounded shadow w-full mt-1 max-h-56 overflow-y-auto">
                {suggestions.map((s) => (
                  <li
                    key={s.place_id}
                    className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                    onMouseDown={() => handleSuggestionClick(s)}
                  >
                    {s.description}
                  </li>
                ))}
              </ul>
            )}
            {imageLoading && <div className="mb-2 text-sm text-gray-500">Loading property image...</div>}
            {imageUrl && (
              <div className="mb-4 mt-4">
                <img src={imageUrl} alt="Property front" className="rounded shadow max-w-xs" />
              </div>
            )}
          </div>

          {/* Property Type */}
          <div>
            <Label htmlFor="propertyType">Property Type *</Label>
            <select
              id="propertyType"
              value={formData.propertyType}
              onChange={(e) => handleChange('propertyType', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROPERTY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Purchase Price */}
            <div>
              <Label htmlFor="purchasePrice">Purchase Price *</Label>
              <Input
                id="purchasePrice"
                type="text"
                placeholder="150,000.00"
                value={
                  focusedField === 'purchasePrice'
                    ? unformatCurrency(formData.purchasePrice.toString())
                    : formatCurrency(formData.purchasePrice)
                }
                onFocus={() => setFocusedField('purchasePrice')}
                onBlur={e => {
                  setFocusedField(null);
                  // Format on blur
                  const formatted = formatCurrency(e.target.value);
                  handleChange('purchasePrice', formatted);
                }}
                onChange={e => handleChange('purchasePrice', e.target.value)}
                className="mt-1"
                min="1000"
                inputMode="decimal"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum $1,000</p>
            </div>

            {/* Current Value */}
            <div>
              <Label htmlFor="currentValue">Current Market Value</Label>
              <Input
                id="currentValue"
                type="text"
                placeholder="155,000.00"
                value={
                  focusedField === 'currentValue'
                    ? unformatCurrency(formData.currentValue.toString())
                    : formatCurrency(formData.currentValue)
                }
                onFocus={() => setFocusedField('currentValue')}
                onBlur={e => {
                  setFocusedField(null);
                  const formatted = formatCurrency(e.target.value);
                  handleChange('currentValue', formatted);
                }}
                onChange={e => handleChange('currentValue', e.target.value)}
                className="mt-1"
                min="0"
                inputMode="decimal"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank if same as purchase price</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Square Footage */}
            <div>
              <Label htmlFor="squareFootage">Square Footage</Label>
              <Input
                id="squareFootage"
                type="text"
                placeholder="1,200"
                value={
                  focusedField === 'squareFootage'
                    ? unformatCurrency(formData.squareFootage.toString())
                    : formatInteger(formData.squareFootage)
                }
                onFocus={() => setFocusedField('squareFootage')}
                onBlur={e => {
                  setFocusedField(null);
                  // Format on blur
                  const formatted = formatInteger(e.target.value);
                  handleChange('squareFootage', formatted);
                }}
                onChange={e => handleChange('squareFootage', e.target.value)}
                className="mt-1"
                min="100"
                inputMode="numeric"
              />
            </div>

            {/* Lot Size */}
            <div>
              <Label htmlFor="lotSize">Lot Size (acres)</Label>
              <Input
                id="lotSize"
                type="number"
                placeholder="0.25"
                value={formData.lotSize}
                onChange={(e) => handleChange('lotSize', e.target.value)}
                className="mt-1"
                min="0.01"
                step="0.01"
              />
            </div>

            {/* Year Built */}
            <div>
              <Label htmlFor="yearBuilt">Year Built</Label>
              <Input
                id="yearBuilt"
                type="number"
                placeholder="2005"
                value={formData.yearBuilt}
                onChange={(e) => handleChange('yearBuilt', e.target.value)}
                className="mt-1"
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bedrooms */}
            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                placeholder="3"
                value={formData.bedrooms}
                onChange={(e) => handleChange('bedrooms', e.target.value)}
                className="mt-1"
                min="0"
                max="20"
              />
            </div>

            {/* Bathrooms */}
            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                placeholder="2"
                value={formData.bathrooms}
                onChange={(e) => handleChange('bathrooms', e.target.value)}
                className="mt-1"
                min="0"
                max="20"
                step="0.5"
              />
            </div>

            {/* Condition */}
            <div>
              <Label htmlFor="condition">Property Condition</Label>
              <select
                id="condition"
                value={formData.condition}
                onChange={(e) => handleChange('condition', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PROPERTY_CONDITIONS.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rental Strategy Selection */}
          <div className="border rounded-md p-4 mt-2 bg-blue-50">
            <Label htmlFor="rentalStrategy">Rental Strategy *</Label>

            <select
              id="rentalStrategy"
              value={formData.rentalStrategy}
              onChange={(e) => {
                const newStrategy = e.target.value as 'entire-house' | 'individual-rooms';
                
                // Update formData in a single state update to avoid race conditions
                setFormData(prev => {
                  const newData = { ...prev, rentalStrategy: newStrategy };
                  
                  // Reset appropriate data when switching strategies
                  if (newStrategy === 'entire-house') {
                    // Clear room rental data
                    newData.rentableRooms = [];
                    newData.grossRent = prev.grossRent; // Keep existing grossRent for entire-house
                  } else if (newStrategy === 'individual-rooms') {
                    // Clear entire-house rental data
                    newData.grossRent = '';
                  }
                  
                  return newData;
                });
                
                // Also reset related UI state
                if (newStrategy === 'entire-house') {
                  setNumRoomsToRent(0);
                  setRoomRates([]);
                }
              }}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="entire-house">Rent Entire House/Unit</option>
              <option value="individual-rooms">Rent Individual Rooms</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">
              Choose whether you'll rent the entire property to one tenant or rent individual rooms to multiple tenants
            </p>
          </div>

          {/* Monthly Gross Rent - Only show when entire-house strategy is selected */}
          {formData.rentalStrategy === 'entire-house' && (
            <div className="border rounded-md p-4 mt-2 bg-gray-50">
              <Label htmlFor="grossRent">Monthly Gross Rent *</Label>
              <Input
                id="grossRent"
                type="text"
                value={
                  focusedField === 'grossRent'
                    ? unformatCurrency(formData.grossRent?.toString() || '')
                    : formatCurrency(formData.grossRent || '')
                }
                onFocus={() => setFocusedField('grossRent')}
                onBlur={(e) => {
                  setFocusedField(null);
                  const formatted = formatCurrency(e.target.value);
                  handleChange('grossRent', formatted);
                }}
                onChange={(e) => handleChange('grossRent', e.target.value)}
                placeholder="2,000.00"
                className="mt-1 w-48"
                inputMode="decimal"
                step="0.01"
              />
              <p className="text-xs text-gray-600 mt-1">
                Expected monthly rental income for the entire property
              </p>
            </div>
          )}

          {/* Room Rental Feature - Only show when individual-rooms strategy is selected */}
          {formData.rentalStrategy === 'individual-rooms' && (
            <div className="border rounded-md p-4 mt-2 bg-gray-50">
              <Label htmlFor="numRoomsToRent">Rooms to Rent</Label>
            <Input
              id="numRoomsToRent"
              type="number"
              min={0}
              max={formData.bedrooms || 20}
              value={numRoomsToRent}
              onChange={e => handleNumRoomsChange(Number(e.target.value))}
              className="mt-1 w-32"
            />
            {roomValidationError && (
              <p className="text-red-500 text-sm mt-1">{roomValidationError}</p>
            )}
            {numRoomsToRent > 0 && (
              <div className="mt-2 space-y-2">
                {Array.from({ length: numRoomsToRent }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Label htmlFor={`room-rate-${idx}`}>Room {idx + 1} Weekly Rate</Label>
                    <Input
                      id={`room-rate-${idx}`}
                      type="text"
                      min={0}
                      value={
                        focusedField === `room-rate-${idx}`
                          ? unformatCurrency(roomRates[idx]?.toString() || '')
                          : formatCurrency(roomRates[idx] || '')
                      }
                      onFocus={() => setFocusedField(`room-rate-${idx}`)}
                      onBlur={e => {
                        setFocusedField(null);
                        const formatted = formatCurrency(e.target.value);
                        handleRoomRateChange(idx, formatted);
                      }}
                      onChange={e => handleRoomRateChange(idx, e.target.value)}
                      className="w-32"
                      inputMode="decimal"
                      step="0.01"
                    />
                  </div>
                ))}
                <div className="mt-2 font-semibold text-blue-700">
                  Total Monthly Rent Estimate: ${totalMonthlyRoomRent.toLocaleString()}
                </div>
              </div>
            )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button 
          onClick={onNext} 
          disabled={!isValid()}
          className="px-8"
        >
          Next: Financing
        </Button>
      </div>
    </div>
  )
}