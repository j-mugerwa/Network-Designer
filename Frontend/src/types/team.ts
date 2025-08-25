// src/types/team.ts

export interface User {
  uid?: string;
  id?: string;
  _id?: string;
  name: string;
  email: string;
  avatar?: string;
  firebaseUID?: string;
}

export interface TeamMember {
  userId: string | User;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  /*
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  */
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: "admin" | "member";
  token: string;
  status: "pending" | "accepted" | "expired";
  expiresAt: string;
  company: string;
  inviter: {
    name: string;
    email: string;
  };
}

export interface Team {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  createdBy: string;
  members: TeamMember[];
  invitations: TeamInvitation[];
  //designs: string[];
  designs: TeamDesign[];
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
  _id: string;
  id: string;
  designName: string;
  description?: string;
  designStatus: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastModified?: string;
  permissions?: {
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
  role: "admin" | "member";
  message?: string;
  company?: string; // Add company to payload
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  avatar?: string;
}

export interface AcceptInvitationResponse {
  team: Team;
  authToken?: string;
}
