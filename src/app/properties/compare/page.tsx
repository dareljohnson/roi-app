
import dynamic from "next/dynamic";
const ComparePage = dynamic(() => import("./ComparePage.server"), { ssr: false });
export default ComparePage;
