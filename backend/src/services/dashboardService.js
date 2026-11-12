import incidentRepository from '../repositories/incidentRepository.js';
import resourceRepository from '../repositories/resourceRepository.js';
import hospitalRepository from '../repositories/hospitalRepository.js';
import teamRepository from '../repositories/teamRepository.js';

class DashboardService {
  async getDashboardSummary() {
    const [incidentResult, resourceResult, hospitalResult] = await Promise.all([
      incidentRepository.findAll({ limit: 10000 }),
      resourceRepository.findAll({ limit: 10000 }),
      hospitalRepository.findAll({ limit: 10000 }),
    ]);
    const incidents = incidentResult.data;
    const resources = resourceResult.data;
    const hospitals = hospitalResult.data;
    const teams = await teamRepository.findAll();
    const activeIncidents = incidents.filter((item) => String(item.status).toLowerCase() !== 'resolved');
    const sum = (items, ...fields) => items.reduce((total, item) => total + Number(fields.map((field) => item[field]).find((value) => value !== undefined) || 0), 0);

    return {
      activeIncidents: activeIncidents.length,
      criticalIncidents: activeIncidents.filter((item) => String(item.severity).toLowerCase() === 'critical').length,
      availableResources: resources.filter((item) => String(item.status).toLowerCase() === 'available').length,
      availableHospitalBeds: sum(hospitals, 'bedsAvail', 'availableBeds'),
      activeTeams: teams.filter((team) => ['deployed', 'assigned', 'available'].includes(String(team.availability).toLowerCase())).length,
      totalIncidents: incidentResult.total,
      totalHospitalBeds: sum(hospitals, 'bedsTotal', 'totalBeds'),
      totalICUBedsAvailable: sum(hospitals, 'icuAvail', 'availableICUBeds'),
      totalAmbulances: sum(hospitals, 'ambulances'),
      peopleAffected: sum(incidents, 'affectedPeople', 'affected'),
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
