import EquipmentHealthView from '../../components/EquipmentHealthView.jsx'
import './equipment.css'
export default function Equipment({ data, selectedSite, onSelectSite, currentUser }) { return <div className="page-content"><EquipmentHealthView data={data} selectedSite={selectedSite} onSelectSite={onSelectSite} currentUser={currentUser} /><footer className="data-footer">Equipment readings: 2025 · Maintenance planning</footer></div> }
