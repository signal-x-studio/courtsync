import type { CourtScheduleResponse } from '../types';

const API_BASE_URL = 'https://results.advancedeventsystems.com/api';
const ODATA_BASE_URL = 'https://results.advancedeventsystems.com/odata';

export const fetchCourtSchedule = async (
  eventId: string,
  date: string,
  timeWindow: number
): Promise<CourtScheduleResponse> => {
  const url = `${API_BASE_URL}/event/${eventId}/courts/${date}/${timeWindow}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch court schedule: ${response.statusText}`);
  }
  
  return response.json();
};

export const fetchEventInfo = async (eventId: string) => {
  const url = `${API_BASE_URL}/event/${eventId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch event info: ${response.statusText}`);
  }
  return response.json();
};

export const fetchTeamAssignments = async (eventId: string, clubId: number) => {
  const url = `${ODATA_BASE_URL}/${eventId}/nextassignments(dId=null,cId=${clubId},tIds=[])?$skip=0&$orderby=TeamName,TeamCode`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch team assignments: ${response.statusText}`);
  }
  return response.json();
};

export const fetchTeamSchedule = async (
  eventId: string,
  divisionId: number,
  teamId: number,
  scheduleType: 'current' | 'work' | 'future'
) => {
  const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/team/${teamId}/schedule/${scheduleType}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch team schedule: ${response.statusText}`);
  }
  return response.json();
};

export const fetchTeamRoster = async (
  eventId: string,
  divisionId: number,
  teamId: number
) => {
  const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/team/${teamId}/roster`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch team roster: ${response.statusText}`);
  }
  return response.json();
};

export const fetchDivisionPlays = async (
  eventId: string,
  divisionId: number
) => {
  const url = `${API_BASE_URL}/event/${eventId}/division/${divisionId}/plays`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch division plays: ${response.statusText}`);
  }
  return response.json();
};

export const fetchPoolSheet = async (
  eventId: string,
  playId: number
) => {
  const url = `${API_BASE_URL}/event/${eventId}/poolsheet/${playId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch pool sheet: ${response.statusText}`);
  }
  return response.json();
};
