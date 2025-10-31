import { useMemo, useState, useEffect } from 'react';
import type { FilteredMatch } from '../types';
import type { useCoverageStatus } from '../hooks/useCoverageStatus';
import type { useTeamCoordination } from '../hooks/useTeamCoordination';
import { useFilters } from '../hooks/useFilters';
import { generateShareableUrl, extractCoverageFromUrl, hasShareableCoverageInUrl } from '../utils/coverageShare';
import { CoverageHandoffDialog } from './CoverageHandoffDialog';

interface TeamCoverageViewProps {
  matches: FilteredMatch[];
  coverageStatus: ReturnType<typeof useCoverageStatus>;
  teamCoordination: ReturnType<typeof useTeamCoordination>;
}

export const TeamCoverageView = ({
  matches,
  coverageStatus,
  teamCoordination,
}: TeamCoverageViewProps) => {
  const { getTeamIdentifier } = useFilters();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [handoffDialog, setHandoffDialog] = useState<{ teamId: string; fromMemberId: string } | null>(null);

  // Build coverage status map for export
  const coverageStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    matches.forEach(match => {
      const teamId = getTeamIdentifier(match);
      if (teamId) {
        map.set(teamId, coverageStatus.getTeamStatus(teamId));
      }
    });
    return map;
  }, [matches, coverageStatus, getTeamIdentifier]);

  // Check for shareable coverage data in URL on mount
  useEffect(() => {
    if (hasShareableCoverageInUrl()) {
      const urlData = extractCoverageFromUrl();
      if (urlData) {
        // Show import dialog with URL data pre-filled
        setImportJson(JSON.stringify(urlData, null, 2));
        setShowImportDialog(true);
        // Clear hash after extracting
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Export handler
  const handleExport = () => {
    const json = teamCoordination.exportCoverageStatus(coverageStatusMap as any);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coverage-status-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Generate shareable link
  const handleGenerateLink = () => {
    const currentMember = teamCoordination.getCurrentMember();
    if (!currentMember) {
      alert('Please select a team member first');
      return;
    }

    // Build export data from current teamCoverageMap
    // Note: teamCoverageMap is defined later, so we'll build it here
    const exportData = {
      memberId: currentMember.id,
      memberName: currentMember.name,
      exportedAt: new Date().toISOString(),
      assignments: [] as Array<{ teamId: string }>,
      coverageStatus: {} as Record<string, string>,
    };

    // Build map dynamically
    const tempMap = new Map<string, { teamId: string; status: string; assignment: string | null }>();
    matches.forEach(match => {
      const teamId = getTeamIdentifier(match);
      if (teamId) {
        if (!tempMap.has(teamId)) {
          tempMap.set(teamId, {
            teamId,
            status: coverageStatus.getTeamStatus(teamId),
            assignment: teamCoordination.getTeamAssignment(teamId),
          });
        }
      }
    });

    // Filter by current member
    Array.from(tempMap.entries()).forEach(([teamId, team]) => {
      if (team.assignment === currentMember.id) {
        exportData.assignments.push({ teamId });
        exportData.coverageStatus[teamId] = team.status;
      }
    });

    const shareableUrl = generateShareableUrl(exportData as any);
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareableUrl).then(() => {
      alert('Shareable link copied to clipboard!');
    }).catch(() => {
      // Fallback: show URL in prompt
      prompt('Shareable link (copy this):', shareableUrl);
    });
  };

  // Handoff handler
  const handleHandoff = (teamId: string, fromMemberId: string, toMemberId: string, note: string) => {
    // Transfer assignment
    teamCoordination.assignTeam(teamId, toMemberId);
    
    // Optionally log handoff (could store in localStorage for history)
    console.log(`Handoff: Team ${teamId} from ${fromMemberId} to ${toMemberId}`, note);
    
    setHandoffDialog(null);
  };

  // Import handler
  const handleImport = () => {
    try {
      setImportError(null);
      const result = teamCoordination.importCoverageStatus(importJson, 'merge');
      if (result.success) {
        // Import coverage status into the hook
        try {
          const data = JSON.parse(importJson);
          if (data.coverageStatus) {
            Object.entries(data.coverageStatus).forEach(([teamId, status]) => {
              coverageStatus.setTeamStatus(teamId, status as any);
            });
          }
        } catch (e) {
          console.error('Failed to import coverage status:', e);
        }
        
        setShowImportDialog(false);
        setImportJson('');
        alert('Coverage status imported successfully!');
      } else {
        setImportError(result.error || 'Import failed');
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Build team coverage map
  const teamCoverageMap = useMemo(() => {
    const map = new Map<string, {
      teamId: string;
      status: string;
      assignment: string | null;
      matches: FilteredMatch[];
    }>();

    matches.forEach(match => {
      const teamId = getTeamIdentifier(match);
      if (!teamId) return;

      if (!map.has(teamId)) {
        map.set(teamId, {
          teamId,
          status: coverageStatus.getTeamStatus(teamId),
          assignment: teamCoordination.getTeamAssignment(teamId),
          matches: [],
        });
      }

      map.get(teamId)!.matches.push(match);
    });

    return map;
  }, [matches, coverageStatus, teamCoordination, getTeamIdentifier]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTeams = teamCoverageMap.size;
    const assignedTeams = Array.from(teamCoverageMap.values())
      .filter(t => t.assignment !== null).length;
    const unassignedTeams = totalTeams - assignedTeams;

    // Detect conflicts (teams assigned to multiple members)
    // Note: In our current implementation, assignments are stored as teamId -> memberId (one-to-one)
    // Conflicts would occur if multiple assignments exist for the same team
    // This would require checking assignment history or importing conflicting data
    const assignmentConflicts = new Map<string, string[]>(); // teamId -> memberIds[]
    
    // For now, we'll detect potential conflicts by checking if a team appears multiple times
    // in different contexts (e.g., imported data vs current data)
    Array.from(teamCoverageMap.values()).forEach(team => {
      if (team.assignment) {
        if (!assignmentConflicts.has(team.teamId)) {
          assignmentConflicts.set(team.teamId, []);
        }
        assignmentConflicts.get(team.teamId)!.push(team.assignment);
      }
    });

    // Coverage by member
    const coverageByMember = new Map<string, {
      covered: number;
      partiallyCovered: number;
      planned: number;
      uncovered: number;
    }>();

    Array.from(teamCoverageMap.values()).forEach(team => {
      if (team.assignment) {
        const memberStats = coverageByMember.get(team.assignment) || {
          covered: 0,
          partiallyCovered: 0,
          planned: 0,
          uncovered: 0,
        };

        if (team.status === 'covered') {
          memberStats.covered++;
        } else if (team.status === 'partially-covered') {
          memberStats.partiallyCovered++;
        } else if (team.status === 'planned') {
          memberStats.planned++;
        } else {
          memberStats.uncovered++;
        }

        coverageByMember.set(team.assignment, memberStats);
      }
    });

    return {
      totalTeams,
      assignedTeams,
      unassignedTeams,
      coverageByMember,
      assignmentConflicts,
    };
  }, [teamCoverageMap]);

  // Group teams by assignment
  const teamsByAssignment = useMemo(() => {
    const grouped = new Map<string, Array<typeof teamCoverageMap extends Map<string, infer V> ? V : never>>();

    Array.from(teamCoverageMap.values()).forEach(team => {
      const key = team.assignment || 'unassigned';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(team);
    });

    return grouped;
  }, [teamCoverageMap]);

  return (
    <div className="space-y-6">
      {/* Export/Import Section */}
      <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#f8f8f9]">Share Coverage Status</h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463] transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={handleGenerateLink}
              className="px-3 py-1.5 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463] transition-colors"
            >
              Generate Link
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              className="px-3 py-1.5 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463] transition-colors"
            >
              Import JSON
            </button>
          </div>
        </div>
        <p className="text-xs text-[#9fa2ab]">
          Export your coverage status to share with team members, generate a shareable link, or import coverage status from others.
        </p>
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#3b3c48] border border-[#454654] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#f8f8f9]">Import Coverage Status</h3>
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportJson('');
                  setImportError(null);
                }}
                className="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors"
              >
                ✕
              </button>
            </div>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste JSON data here..."
              className="w-full h-64 px-3 py-2 text-sm rounded bg-[#454654] text-[#f8f8f9] border border-[#525463] focus:border-[#eab308] focus:outline-none font-mono"
            />
            {importError && (
              <div className="mt-2 text-xs text-red-400">{importError}</div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleImport}
                className="px-3 py-1.5 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportJson('');
                  setImportError(null);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] hover:bg-[#525463] border border-[#525463] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Total Teams</div>
          <div className="text-2xl font-bold text-[#f8f8f9]">{stats.totalTeams}</div>
        </div>
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Assigned</div>
          <div className="text-2xl font-bold text-green-400">{stats.assignedTeams}</div>
        </div>
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <div className="text-xs text-[#9fa2ab] uppercase tracking-wider mb-1">Unassigned</div>
          <div className="text-2xl font-bold text-[#808593]">{stats.unassignedTeams}</div>
        </div>
      </div>

      {/* Coverage by Member */}
      {teamCoordination.members.length > 0 && (
        <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
          <h3 className="text-sm font-semibold text-[#f8f8f9] mb-4">Coverage by Team Member</h3>
          <div className="space-y-3">
            {teamCoordination.members.map(member => {
              const memberStats = stats.coverageByMember.get(member.id) || {
                covered: 0,
                partiallyCovered: 0,
                planned: 0,
                uncovered: 0,
              };
              const total = memberStats.covered + memberStats.partiallyCovered + memberStats.planned + memberStats.uncovered;

              return (
                <div key={member.id} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: member.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#f8f8f9]">{member.name}</div>
                    <div className="text-xs text-[#9fa2ab]">
                      {total} team{total !== 1 ? 's' : ''} • {memberStats.covered} covered • {memberStats.planned} planned
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Assignments */}
      <div className="rounded-lg border border-[#454654] bg-[#3b3c48] p-4">
        <h3 className="text-sm font-semibold text-[#f8f8f9] mb-4">Team Assignments</h3>
        
        {/* Unassigned Teams */}
        {teamsByAssignment.has('unassigned') && (
          <div className="mb-6">
            <h4 className="text-xs font-medium text-[#808593] uppercase tracking-wider mb-2">
              Unassigned ({teamsByAssignment.get('unassigned')!.length})
            </h4>
            <div className="space-y-1">
              {teamsByAssignment.get('unassigned')!.map(team => (
                <div
                  key={team.teamId}
                  className="flex items-center justify-between p-2 rounded bg-[#454654] border border-[#525463]"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded ${
                      team.status === 'covered'
                        ? 'bg-green-500'
                        : team.status === 'partially-covered'
                        ? 'bg-[#f59e0b]'
                        : team.status === 'planned'
                        ? 'bg-[#eab308]'
                        : 'bg-[#808593]'
                    }`} />
                    <span className="text-sm text-[#f8f8f9]">Team {team.teamId}</span>
                    <span className="text-xs text-[#9fa2ab]">({team.matches.length} matches)</span>
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        teamCoordination.assignTeam(team.teamId, e.target.value);
                      }
                    }}
                    className="px-2 py-1 text-xs rounded bg-[#3b3c48] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none"
                  >
                    <option value="">Assign...</option>
                    {teamCoordination.members.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assigned Teams by Member */}
        {teamCoordination.members.map(member => {
          const memberTeams = teamsByAssignment.get(member.id) || [];
          if (memberTeams.length === 0) return null;

          return (
            <div key={member.id} className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <h4 className="text-xs font-medium text-[#f8f8f9] uppercase tracking-wider">
                  {member.name} ({memberTeams.length})
                </h4>
              </div>
              <div className="space-y-1">
                {memberTeams.map(team => (
                  <div
                    key={team.teamId}
                    className="flex items-center justify-between p-2 rounded bg-[#454654] border border-[#525463]"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded ${
                        team.status === 'covered'
                          ? 'bg-green-500'
                          : team.status === 'partially-covered'
                          ? 'bg-[#f59e0b]'
                          : team.status === 'planned'
                          ? 'bg-[#eab308]'
                          : 'bg-[#808593]'
                      }`} />
                      <span className="text-sm text-[#f8f8f9]">Team {team.teamId}</span>
                      <span className="text-xs text-[#9fa2ab]">({team.matches.length} matches)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setHandoffDialog({ teamId: team.teamId, fromMemberId: member.id })}
                        className="px-2 py-1 text-xs text-[#9fa2ab] hover:text-[#eab308] transition-colors"
                        title="Transfer to another member"
                      >
                        ↪
                      </button>
                      <button
                        onClick={() => teamCoordination.unassignTeam(team.teamId)}
                        className="px-2 py-1 text-xs text-[#9fa2ab] hover:text-red-400 transition-colors"
                        title="Unassign"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Handoff Dialog */}
      {handoffDialog && (
        <CoverageHandoffDialog
          teamId={handoffDialog.teamId}
          fromMemberId={handoffDialog.fromMemberId}
          teamCoordination={teamCoordination}
          onClose={() => setHandoffDialog(null)}
          onHandoff={(toMemberId: string, note: string) => handleHandoff(handoffDialog.teamId, handoffDialog.fromMemberId, toMemberId, note)}
        />
      )}
    </div>
  );
};

