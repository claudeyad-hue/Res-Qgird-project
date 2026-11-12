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
    return {
      activeIncidents: activeIncidents.length,
      criticalIncidents: activeIncidents.filter((item) => String(item.severity).toLowerCase() === 'critical').length,
      availableResources: resources.filter((item) => String(item.status).toLowerCase() === 'available').length,
      hospitalDirectoryCount: hospitalResult.total,
      mappedHospitalCount: hospitals.filter((hospital) => Number.isFinite(Number(hospital.latitude)) && Number.isFinite(Number(hospital.longitude))).length,
      liveAvailabilityConnected: false,
      availableHospitalBeds: null,
      activeTeams: teams.filter((team) => ['deployed', 'assigned', 'available'].includes(String(team.availability).toLowerCase())).length,
      totalIncidents: incidentResult.total,
      totalHospitalBeds: null,
      totalICUBedsAvailable: null,
      totalAmbulances: null,
      peopleAffected: incidents.reduce((total, item) => total + Number(item.affectedPeople ?? item.affected ?? 0), 0),
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
