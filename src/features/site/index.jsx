import { EmptyState } from '../../ui/index.jsx'
import './site.css'
export default function Site({ siteId }) { return <div className="page-content"><EmptyState title={`Site ${siteId || 'page'}`} guideSection="Product guide section 4" /></div> }
