/**
 * Organization Metrics Service
 * Service for department-level aggregation, team performance tracking, 
 * and reporting structure functions
 */

import {
  Department,
  Team,
  TeamRole,
  TeamMembership,
  ReportingRelationship,
  DepartmentMetrics,
  TeamMetrics,
  OrganizationNode
} from '../types/organization.types';

import { learnerProfileService } from './learner-profile.service';
import { ProficiencyLevel } from '../types/employee.types';

// Mock data for demonstration purposes
const mockDepartments: Department[] = [
  {
    id: 'dept-001',
    name: 'Engineering',
    description: 'Software development and technical operations',
    headId: 'emp-005',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: 'dept-002',
    name: 'Product',
    description: 'Product management and design',
    headId: 'emp-010',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: 'dept-003',
    name: 'Marketing',
    description: 'Brand management and marketing operations',
    headId: 'emp-015',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: 'dept-004',
    name: 'Human Resources',
    description: 'Talent acquisition and employee development',
    headId: 'emp-020',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-06-15')
  }
];

const mockTeams: Team[] = [
  {
    id: 'team-001',
    name: 'Frontend',
    description: 'Frontend web development team',
    departmentId: 'dept-001',
    leadId: 'emp-002',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15')
  },
  {
    id: 'team-002',
    name: 'Backend',
    description: 'Backend and API development team',
    departmentId: 'dept-001',
    leadId: 'emp-003',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15')
  },
  {
    id: 'team-003',
    name: 'DevOps',
    description: 'Infrastructure and deployment team',
    departmentId: 'dept-001',
    leadId: 'emp-004',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15')
  },
  {
    id: 'team-004',
    name: 'UX Design',
    description: 'User experience design team',
    departmentId: 'dept-002',
    leadId: 'emp-011',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15')
  },
  {
    id: 'team-005',
    name: 'Product Management',
    description: 'Product management team',
    departmentId: 'dept-002',
    leadId: 'emp-012',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15')
  }
];

const mockTeamMemberships: TeamMembership[] = [
  {
    id: 'tm-001',
    employeeId: 'emp-001',
    teamId: 'team-001',
    role: TeamRole.MEMBER,
    joinedAt: new Date('2023-02-01'),
    isActive: true
  },
  {
    id: 'tm-002',
    employeeId: 'emp-002',
    teamId: 'team-001',
    role: TeamRole.LEAD,
    joinedAt: new Date('2023-01-15'),
    isActive: true
  },
  {
    id: 'tm-003',
    employeeId: 'emp-003',
    teamId: 'team-002',
    role: TeamRole.LEAD,
    joinedAt: new Date('2023-01-15'),
    isActive: true
  },
  {
    id: 'tm-004',
    employeeId: 'emp-004',
    teamId: 'team-003',
    role: TeamRole.LEAD,
    joinedAt: new Date('2023-01-15'),
    isActive: true
  },
  {
    id: 'tm-005',
    employeeId: 'emp-006',
    teamId: 'team-001',
    role: TeamRole.MEMBER,
    joinedAt: new Date('2023-03-01'),
    isActive: true
  },
  {
    id: 'tm-006',
    employeeId: 'emp-007',
    teamId: 'team-002',
    role: TeamRole.MEMBER,
    joinedAt: new Date('2023-03-01'),
    isActive: true
  },
  {
    id: 'tm-007',
    employeeId: 'emp-008',
    teamId: 'team-002',
    role: TeamRole.MEMBER,
    joinedAt: new Date('2023-03-01'),
    isActive: true
  },
  {
    id: 'tm-008',
    employeeId: 'emp-009',
    teamId: 'team-003',
    role: TeamRole.MEMBER,
    joinedAt: new Date('2023-03-01'),
    isActive: true
  }
];

const mockReportingRelationships: ReportingRelationship[] = [
  {
    id: 'rr-001',
    employeeId: 'emp-001',
    managerId: 'emp-002',
    startDate: new Date('2023-02-01'),
    isActive: true,
    isPrimary: true
  },
  {
    id: 'rr-002',
    employeeId: 'emp-002',
    managerId: 'emp-005',
    startDate: new Date('2023-01-15'),
    isActive: true,
    isPrimary: true
  },
  {
    id: 'rr-003',
    employeeId: 'emp-003',
    managerId: 'emp-005',
    startDate: new Date('2023-01-15'),
    isActive: true,
    isPrimary: true
  },
  {
    id: 'rr-004',
    employeeId: 'emp-004',
    managerId: 'emp-005',
    startDate: new Date('2023-01-15'),
    isActive: true,
    isPrimary: true
  },
  {
    id: 'rr-005',
    employeeId: 'emp-006',
    managerId: 'emp-002',
    startDate: new Date('2023-03-01'),
    isActive: true,
    isPrimary: true
  },
  {
    id: 'rr-006',
    employeeId: 'emp-007',
    managerId: 'emp-003',
    startDate: new Date('2023-03-01'),
    isActive: true,
    isPrimary: true
  },
  {
    id: 'rr-007',
    employeeId: 'emp-008',
    managerId: 'emp-003',
    startDate: new Date('2023-03-01'),
    isActive: true,
    isPrimary: true
  },
  {
    id: 'rr-008',
    employeeId: 'emp-009',
    managerId: 'emp-004',
    startDate: new Date('2023-03-01'),
    isActive: true,
    isPrimary: true
  }
];

// Sample metrics data for mock implementation
const mockDepartmentMetrics: Record<string, DepartmentMetrics> = {
  'dept-001': {
    departmentId: 'dept-001',
    departmentName: 'Engineering',
    employeeCount: 8,
    teamCount: 3,
    learningMetrics: {
      averageCompletionRate: 0.82,
      averageTimeToCompletion: 18, // days
      ragStatusDistribution: {
        green: 6,
        amber: 1,
        red: 1
      }
    },
    skillCoverage: [
      {
        skillName: 'JavaScript',
        proficiencyAverage: 0.78,
        employeesWithSkill: 7
      },
      {
        skillName: 'React',
        proficiencyAverage: 0.72,
        employeesWithSkill: 5
      },
      {
        skillName: 'Node.js',
        proficiencyAverage: 0.65,
        employeesWithSkill: 4
      },
      {
        skillName: 'DevOps',
        proficiencyAverage: 0.55,
        employeesWithSkill: 3
      },
      {
        skillName: 'AWS',
        proficiencyAverage: 0.60,
        employeesWithSkill: 3
      }
    ]
  },
  'dept-002': {
    departmentId: 'dept-002',
    departmentName: 'Product',
    employeeCount: 5,
    teamCount: 2,
    learningMetrics: {
      averageCompletionRate: 0.76,
      averageTimeToCompletion: 22, // days
      ragStatusDistribution: {
        green: 3,
        amber: 2,
        red: 0
      }
    },
    skillCoverage: [
      {
        skillName: 'Product Management',
        proficiencyAverage: 0.82,
        employeesWithSkill: 3
      },
      {
        skillName: 'UX Design',
        proficiencyAverage: 0.85,
        employeesWithSkill: 2
      },
      {
        skillName: 'User Research',
        proficiencyAverage: 0.70,
        employeesWithSkill: 2
      },
      {
        skillName: 'Analytics',
        proficiencyAverage: 0.68,
        employeesWithSkill: 4
      }
    ]
  }
};

const mockTeamMetrics: Record<string, TeamMetrics> = {
  'team-001': {
    teamId: 'team-001',
    teamName: 'Frontend',
    departmentId: 'dept-001',
    departmentName: 'Engineering',
    employeeCount: 3,
    learningMetrics: {
      averageCompletionRate: 0.85,
      averageTimeToCompletion: 16, // days
      ragStatusDistribution: {
        green: 2,
        amber: 1,
        red: 0
      }
    },
    topSkills: [
      {
        skillName: 'JavaScript',
        proficiencyAverage: 0.88
      },
      {
        skillName: 'React',
        proficiencyAverage: 0.85
      },
      {
        skillName: 'CSS',
        proficiencyAverage: 0.78
      },
      {
        skillName: 'HTML',
        proficiencyAverage: 0.90
      },
      {
        skillName: 'TypeScript',
        proficiencyAverage: 0.75
      }
    ]
  },
  'team-002': {
    teamId: 'team-002',
    teamName: 'Backend',
    departmentId: 'dept-001',
    departmentName: 'Engineering',
    employeeCount: 3,
    learningMetrics: {
      averageCompletionRate: 0.80,
      averageTimeToCompletion: 19, // days
      ragStatusDistribution: {
        green: 2,
        amber: 0,
        red: 1
      }
    },
    topSkills: [
      {
        skillName: 'Node.js',
        proficiencyAverage: 0.82
      },
      {
        skillName: 'SQL',
        proficiencyAverage: 0.78
      },
      {
        skillName: 'GraphQL',
        proficiencyAverage: 0.70
      },
      {
        skillName: 'MongoDB',
        proficiencyAverage: 0.65
      },
      {
        skillName: 'API Design',
        proficiencyAverage: 0.80
      }
    ]
  }
};

/**
 * Service for managing organizational metrics
 */
export class OrganizationMetricsService {
  /**
   * Get all departments
   */
  async getAllDepartments(): Promise<Department[]> {
    // In a real implementation, this would query the database
    return [...mockDepartments];
  }

  /**
   * Get a department by ID
   */
  async getDepartmentById(departmentId: string): Promise<Department | null> {
    // In a real implementation, this would query the database
    const department = mockDepartments.find(d => d.id === departmentId);
    return department ? { ...department } : null;
  }

  /**
   * Get all teams
   */
  async getAllTeams(): Promise<Team[]> {
    // In a real implementation, this would query the database
    return [...mockTeams];
  }

  /**
   * Get a team by ID
   */
  async getTeamById(teamId: string): Promise<Team | null> {
    // In a real implementation, this would query the database
    const team = mockTeams.find(t => t.id === teamId);
    return team ? { ...team } : null;
  }

  /**
   * Get teams by department ID
   */
  async getTeamsByDepartment(departmentId: string): Promise<Team[]> {
    // In a real implementation, this would query the database
    return mockTeams.filter(t => t.departmentId === departmentId);
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<{ employeeId: string; role: TeamRole }[]> {
    // In a real implementation, this would query the database with joins
    const memberships = mockTeamMemberships.filter(m => m.teamId === teamId && m.isActive);
    return memberships.map(m => ({
      employeeId: m.employeeId,
      role: m.role
    }));
  }

  /**
   * Get all teams for an employee
   */
  async getEmployeeTeams(employeeId: string): Promise<{ teamId: string; teamName: string; role: TeamRole }[]> {
    // In a real implementation, this would query the database with joins
    const memberships = mockTeamMemberships.filter(m => m.employeeId === employeeId && m.isActive);
    return memberships.map(m => {
      const team = mockTeams.find(t => t.id === m.teamId);
      return {
        teamId: m.teamId,
        teamName: team?.name || 'Unknown Team',
        role: m.role
      };
    });
  }

  /**
   * Get an employee's manager
   */
  async getEmployeeManager(employeeId: string): Promise<{ managerId: string; isPrimary: boolean } | null> {
    // In a real implementation, this would query the database
    const relationship = mockReportingRelationships.find(
      r => r.employeeId === employeeId && r.isActive
    );
    
    return relationship ? {
      managerId: relationship.managerId,
      isPrimary: relationship.isPrimary
    } : null;
  }

  /**
   * Get all direct reports for a manager
   */
  async getDirectReports(managerId: string): Promise<string[]> {
    // In a real implementation, this would query the database
    const relationships = mockReportingRelationships.filter(
      r => r.managerId === managerId && r.isActive
    );
    
    return relationships.map(r => r.employeeId);
  }

  /**
   * Get all reports for a manager (direct and indirect)
   */
  async getAllReports(managerId: string): Promise<string[]> {
    // In a real implementation, this would use a recursive query
    const result: string[] = [];
    const visited = new Set<string>();
    
    const fetchReports = async (currentManagerId: string) => {
      const directReports = await this.getDirectReports(currentManagerId);
      
      for (const reportId of directReports) {
        if (!visited.has(reportId)) {
          visited.add(reportId);
          result.push(reportId);
          await fetchReports(reportId);
        }
      }
    };
    
    await fetchReports(managerId);
    return result;
  }

  /**
   * Get department metrics
   */
  async getDepartmentMetrics(departmentId: string): Promise<DepartmentMetrics | null> {
    // In a real implementation, this would aggregate data from multiple sources
    return mockDepartmentMetrics[departmentId] || null;
  }

  /**
   * Generate department metrics
   */
  async generateDepartmentMetrics(departmentId: string): Promise<DepartmentMetrics | null> {
    // In a real implementation, this would collect and process data in real-time
    const department = await this.getDepartmentById(departmentId);
    if (!department) return null;
    
    // Get teams in department
    const teams = await this.getTeamsByDepartment(departmentId);
    
    // Get employees in each team
    const employeeIds = new Set<string>();
    for (const team of teams) {
      const members = await this.getTeamMembers(team.id);
      members.forEach(m => employeeIds.add(m.employeeId));
    }
    
    // In a real implementation, the following data would be aggregated from various sources
    // For this mock, we'll return pre-populated metrics if available, or create sample metrics
    
    if (mockDepartmentMetrics[departmentId]) {
      return mockDepartmentMetrics[departmentId];
    }
    
    // Create sample metrics
    const sampleMetrics: DepartmentMetrics = {
      departmentId,
      departmentName: department.name,
      employeeCount: employeeIds.size,
      teamCount: teams.length,
      learningMetrics: {
        averageCompletionRate: 0.75,
        averageTimeToCompletion: 20, // days
        ragStatusDistribution: {
          green: Math.floor(employeeIds.size * 0.7),
          amber: Math.floor(employeeIds.size * 0.2),
          red: Math.floor(employeeIds.size * 0.1)
        }
      },
      skillCoverage: [
        {
          skillName: 'General Skill 1',
          proficiencyAverage: 0.70,
          employeesWithSkill: Math.floor(employeeIds.size * 0.8)
        },
        {
          skillName: 'General Skill 2',
          proficiencyAverage: 0.65,
          employeesWithSkill: Math.floor(employeeIds.size * 0.6)
        }
      ]
    };
    
    return sampleMetrics;
  }

  /**
   * Get team metrics
   */
  async getTeamMetrics(teamId: string): Promise<TeamMetrics | null> {
    // In a real implementation, this would aggregate data from multiple sources
    return mockTeamMetrics[teamId] || null;
  }

  /**
   * Generate team metrics
   */
  async generateTeamMetrics(teamId: string): Promise<TeamMetrics | null> {
    // In a real implementation, this would collect and process data in real-time
    const team = await this.getTeamById(teamId);
    if (!team) return null;
    
    const department = await this.getDepartmentById(team.departmentId);
    if (!department) return null;
    
    // Get team members
    const members = await this.getTeamMembers(teamId);
    const employeeIds = members.map(m => m.employeeId);
    
    // In a real implementation, the following data would be aggregated from various sources
    // For this mock, we'll return pre-populated metrics if available, or create sample metrics
    
    if (mockTeamMetrics[teamId]) {
      return mockTeamMetrics[teamId];
    }
    
    // Create sample metrics
    const sampleMetrics: TeamMetrics = {
      teamId,
      teamName: team.name,
      departmentId: team.departmentId,
      departmentName: department.name,
      employeeCount: employeeIds.length,
      learningMetrics: {
        averageCompletionRate: 0.75,
        averageTimeToCompletion: 20, // days
        ragStatusDistribution: {
          green: Math.floor(employeeIds.length * 0.7),
          amber: Math.floor(employeeIds.length * 0.2),
          red: Math.floor(employeeIds.length * 0.1)
        }
      },
      topSkills: [
        {
          skillName: 'Team Skill 1',
          proficiencyAverage: 0.75
        },
        {
          skillName: 'Team Skill 2',
          proficiencyAverage: 0.70
        }
      ]
    };
    
    return sampleMetrics;
  }

  /**
   * Generate skills report for a department
   */
  async generateDepartmentSkillsReport(departmentId: string): Promise<
    { skillName: string; proficiencyLevels: Record<ProficiencyLevel, number>; totalEmployees: number }[]
  > {
    // In a real implementation, this would aggregate skills data across employees
    const department = await this.getDepartmentById(departmentId);
    if (!department) return [];
    
    // Get teams in department
    const teams = await this.getTeamsByDepartment(departmentId);
    
    // Get employees in each team
    const employeeIds = new Set<string>();
    for (const team of teams) {
      const members = await this.getTeamMembers(team.id);
      members.forEach(m => employeeIds.add(m.employeeId));
    }
    
    // Get skills for each employee
    const skillsMap: Record<string, { 
      totalProficiency: number; 
      employeeCount: number;
      proficiencyLevels: Record<ProficiencyLevel, number>;
    }> = {};
    
    for (const employeeId of employeeIds) {
      try {
        const skills = await learnerProfileService.getEmployeeSkills(employeeId);
        
        for (const skill of skills) {
          if (!skillsMap[skill.skillName]) {
            skillsMap[skill.skillName] = {
              totalProficiency: 0,
              employeeCount: 0,
              proficiencyLevels: {
                [ProficiencyLevel.BEGINNER]: 0,
                [ProficiencyLevel.INTERMEDIATE]: 0,
                [ProficiencyLevel.ADVANCED]: 0,
                [ProficiencyLevel.EXPERT]: 0
              }
            };
          }
          
          skillsMap[skill.skillName].totalProficiency += skill.proficiencyScore;
          skillsMap[skill.skillName].employeeCount += 1;
          skillsMap[skill.skillName].proficiencyLevels[skill.proficiencyLevel] += 1;
        }
      } catch (error) {
        console.error(`Error fetching skills for employee ${employeeId}:`, error);
      }
    }
    
    // Convert to array and sort by employee count
    const result = Object.entries(skillsMap).map(([skillName, data]) => ({
      skillName,
      proficiencyLevels: data.proficiencyLevels,
      totalEmployees: data.employeeCount
    }));
    
    return result.sort((a, b) => b.totalEmployees - a.totalEmployees);
  }

  /**
   * Get the organization hierarchy
   */
  async getOrganizationHierarchy(): Promise<OrganizationNode[]> {
    // In a real implementation, this would build a tree from database records
    const departments = await this.getAllDepartments();
    
    const nodes: OrganizationNode[] = [];
    
    for (const department of departments) {
      const teams = await this.getTeamsByDepartment(department.id);
      const teamNodes: OrganizationNode[] = [];
      
      let departmentEmployeeCount = 0;
      
      for (const team of teams) {
        const members = await this.getTeamMembers(team.id);
        departmentEmployeeCount += members.length;
        
        // Get team lead information if available
        let head = undefined;
        if (team.leadId) {
          try {
            const leadEmployee = await learnerProfileService.getEmployeeById(team.leadId);
            if (leadEmployee) {
              head = {
                id: leadEmployee.id,
                name: `${leadEmployee.firstName} ${leadEmployee.lastName}`,
                title: leadEmployee.title
              };
            }
          } catch (error) {
            console.error(`Error fetching team lead ${team.leadId}:`, error);
          }
        }
        
        teamNodes.push({
          id: team.id,
          type: 'team',
          name: team.name,
          head,
          children: [], // Teams don't have child nodes in this implementation
          employeeCount: members.length
        });
      }
      
      // Get department head information if available
      let head = undefined;
      if (department.headId) {
        try {
          const headEmployee = await learnerProfileService.getEmployeeById(department.headId);
          if (headEmployee) {
            head = {
              id: headEmployee.id,
              name: `${headEmployee.firstName} ${headEmployee.lastName}`,
              title: headEmployee.title
            };
          }
        } catch (error) {
          console.error(`Error fetching department head ${department.headId}:`, error);
        }
      }
      
      nodes.push({
        id: department.id,
        type: 'department',
        name: department.name,
        head,
        children: teamNodes,
        employeeCount: departmentEmployeeCount
      });
    }
    
    return nodes;
  }
}

// Export singleton instance
export const organizationMetricsService = new OrganizationMetricsService(); 