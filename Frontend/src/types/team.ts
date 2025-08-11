// src/types/team.ts
export interface TeamMember {
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface TeamInvitation {
  email: string;
  token: string;
  role: "admin" | "member";
  expiresAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: TeamMember[];
  invitations: TeamInvitation[];
  designs: string[];
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastModified?: {
    by: string;
    at: string;
  };
  designCount?: number;
}

export interface TeamDesign {
  id: string;
  designName: string;
  description?: string;
  designStatus: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastModified?: string;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
}

export interface TeamDesignsResponse {
  team: {
    id: string;
    name: string;
    owner: {
      name: string;
      email: string;
    };
  };
  designs: TeamDesign[];
  count: number;
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  members?: Array<{
    userId: string;
    role?: "admin" | "member";
  }>;
}

export interface InviteMemberPayload {
  email: string;
  role?: "admin" | "member";
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  avatar?: string;
}
