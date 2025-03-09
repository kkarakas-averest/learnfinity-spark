/**
 * Organization Data Structures
 * Types for managing organizational hierarchy, departments, and teams
 */

/**
 * Role within a team
 */
export enum TeamRole {
  MEMBER = 'member',
  LEAD = 'lead',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

/**
 * Department within the organization
 */
export interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string; // Employee ID of department head
  parentDepartmentId?: string; // For nested department structures
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Team within a department
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  departmentId: string;
  leadId?: string; // Employee ID of team lead
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Employee's membership in a team
 */
export interface TeamMembership {
  id: string;
  employeeId: string;
  teamId: string;
  role: TeamRole;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
}

/**
 * Represents the reporting structure between employees
 */
export interface ReportingRelationship {
  id: string;
  employeeId: string; // Direct report
  managerId: string; // Manager
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  isPrimary: boolean; // For matrix organizations with multiple reporting lines
}

/**
 * Aggregated department metrics
 */
export interface DepartmentMetrics {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  teamCount: number;
  learningMetrics: {
    averageCompletionRate: number; // Percentage
    averageTimeToCompletion: number; // In days
    ragStatusDistribution: {
      green: number;
      amber: number;
      red: number;
    };
  };
  skillCoverage: {
    skillName: string;
    proficiencyAverage: number; // 0-1 scale
    employeesWithSkill: number;
  }[];
}

/**
 * Aggregated team metrics
 */
export interface TeamMetrics {
  teamId: string;
  teamName: string;
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  learningMetrics: {
    averageCompletionRate: number; // Percentage
    averageTimeToCompletion: number; // In days
    ragStatusDistribution: {
      green: number;
      amber: number;
      red: number;
    };
  };
  topSkills: {
    skillName: string;
    proficiencyAverage: number; // 0-1 scale
  }[];
}

/**
 * Organization hierarchy node for nested structure representation
 */
export interface OrganizationNode {
  id: string;
  type: 'department' | 'team';
  name: string;
  head?: {
    id: string;
    name: string;
    title: string;
  };
  children: OrganizationNode[];
  employeeCount: number;
} 