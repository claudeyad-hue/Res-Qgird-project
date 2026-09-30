import Incident from '../models/Incident.js';
import Resource from '../models/Resource.js';
import Hospital from '../models/Hospital.js';
import Team from '../models/Team.js';

class DashboardService {
  async getDashboardSummary() {
    const [
      activeIncidentsCount,
      criticalIncidentsCount,
      availableResourcesCount,
      hospitalAggregations,
      activeTeamsCount,
      totalIncidentsCount,
      totalAffectedAggregations,
    ] = await Promise.all([
      // 1. Active incidents (not resolved)
      Incident.countDocuments({ status: { $ne: 'resolved' } }),

      // 2. Critical incidents (critical severity and not resolved)
      Incident.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } }),

      // 3. Available resources count
      Resource.countDocuments({ status: 'available' }),

      // 4. Hospital bed aggregations
      Hospital.aggregate([
        {
          $group: {
            _id: null,
            totalAvailableBeds: { $sum: '$availableBeds' },
            totalBeds: { $sum: '$totalBeds' },
            totalAvailableICUBeds: { $sum: '$availableICUBeds' },
            totalAmbulances: { $sum: '$ambulances' },
          },
        },
      ]),

      // 5. Active teams (deployed, assigned, or available)
      Team.countDocuments({ availability: { $in: ['deployed', 'assigned', 'available'] } }),

      // 6. Total incidents
      Incident.countDocuments(),

      // 7. Total people affected
      Incident.aggregate([
        {
          $group: {
            _id: null,
            totalAffected: { $sum: '$affectedPeople' },
          },
        },
      ]),
    ]);

    const hospitalStats = hospitalAggregations[0] || {
      totalAvailableBeds: 0,
      totalBeds: 0,
      totalAvailableICUBeds: 0,
      totalAmbulances: 0,
    };

    const totalAffected = totalAffectedAggregations[0]?.totalAffected || 0;

    return {
      activeIncidents: activeIncidentsCount,
      criticalIncidents: criticalIncidentsCount,
      availableResources: availableResourcesCount,
      availableHospitalBeds: hospitalStats.totalAvailableBeds,
      activeTeams: activeTeamsCount,
      totalIncidents: totalIncidentsCount,
      totalHospitalBeds: hospitalStats.totalBeds,
      totalICUBedsAvailable: hospitalStats.totalAvailableICUBeds,
      totalAmbulances: hospitalStats.totalAmbulances,
      peopleAffected: totalAffected,
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
