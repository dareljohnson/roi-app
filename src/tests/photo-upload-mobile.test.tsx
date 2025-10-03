import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PhotoUpload } from '../components/walkthrough/PhotoUpload'

describe('PhotoUpload Mobile Camera Feature', () => {
  beforeAll(() => {
    // Simulate mobile user agent
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      configurable: true
    })
  })

  it('renders Take Photo button and camera input on mobile', () => {
    render(
      <PhotoUpload photos={[]} onPhotosChange={() => {}} />
    )
    expect(screen.getByText('Take Photo')).toBeInTheDocument()
  // Camera input should have capture attribute
  const cameraInput = document.querySelector('input[type="file"][capture="environment"]')
  expect(cameraInput).toBeTruthy()
  })
})
