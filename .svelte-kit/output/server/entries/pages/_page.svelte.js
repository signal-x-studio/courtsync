import { b as bind_props, a as attr_class, c as attr_style, d as stringify, e as ensure_array_like, f as attr, g as store_get, u as unsubscribe_stores, h as clsx } from "../../chunks/index2.js";
import { d as derived, w as writable, g as get } from "../../chunks/index.js";
import { Y as ssr_context, Z as fallback, X as escape_html } from "../../chunks/context.js";
import { format } from "date-fns";
import "clsx";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
const detectConflicts = (matches) => {
  const conflicts = /* @__PURE__ */ new Map();
  for (let i = 0; i < matches.length; i++) {
    const match1 = matches[i];
    const conflictsForMatch = [];
    for (let j = 0; j < matches.length; j++) {
      if (i === j) continue;
      const match2 = matches[j];
      const overlaps = match1.ScheduledStartDateTime < match2.ScheduledEndDateTime && match1.ScheduledEndDateTime > match2.ScheduledStartDateTime;
      const differentCourts = match1.CourtId !== match2.CourtId;
      if (overlaps && differentCourts) {
        conflictsForMatch.push(match2.MatchId);
      }
    }
    if (conflictsForMatch.length > 0) {
      conflicts.set(match1.MatchId, conflictsForMatch);
    }
  }
  return conflicts;
};
const formatMatchTime = (timestamp) => {
  return format(new Date(timestamp), "h:mm a");
};
const formatMatchDate = (timestamp) => {
  return format(new Date(timestamp), "MMM d, yyyy");
};
function createCoveragePlan() {
  const { subscribe, set, update } = writable(/* @__PURE__ */ new Set());
  return {
    subscribe,
    toggleMatch: (matchId) => {
      update((selectedMatches2) => {
        const next = new Set(selectedMatches2);
        if (next.has(matchId)) {
          next.delete(matchId);
        } else {
          next.add(matchId);
        }
        return next;
      });
    },
    selectMatch: (matchId) => {
      update((selectedMatches2) => {
        const next = new Set(selectedMatches2);
        next.add(matchId);
        return next;
      });
    },
    deselectMatch: (matchId) => {
      update((selectedMatches2) => {
        const next = new Set(selectedMatches2);
        next.delete(matchId);
        return next;
      });
    },
    clearPlan: () => {
      set(/* @__PURE__ */ new Set());
    }
  };
}
const coveragePlan = createCoveragePlan();
derived(coveragePlan, ($plan) => $plan);
const selectedCount = derived(coveragePlan, ($plan) => $plan.size);
function createCoverageStatus() {
  const { subscribe, set, update } = writable({});
  return {
    subscribe,
    setTeamStatus: (teamId, status) => {
      update((coverageStatus2) => {
        const next = { ...coverageStatus2 };
        if (status === "not-covered") {
          delete next[teamId];
        } else {
          next[teamId] = status;
        }
        return next;
      });
    },
    getTeamStatus: (teamId) => {
      let status = "not-covered";
      subscribe((coverageStatus2) => {
        status = coverageStatus2[teamId] || "not-covered";
      })();
      return status;
    },
    clearAllStatus: () => {
      set({});
    },
    updateFromPlan: (teamId, matchesInPlan, totalMatches) => {
      if (totalMatches === 0) return;
      update((coverageStatus2) => {
        let newStatus;
        if (matchesInPlan === 0) {
          newStatus = "not-covered";
        } else if (matchesInPlan === totalMatches) {
          newStatus = "covered";
        } else {
          newStatus = "partially-covered";
        }
        const currentStatus = coverageStatus2[teamId] || "not-covered";
        if (currentStatus === newStatus) {
          return coverageStatus2;
        }
        const next = { ...coverageStatus2 };
        if (newStatus === "not-covered") {
          delete next[teamId];
        } else {
          next[teamId] = newStatus;
        }
        return next;
      });
    },
    importStatuses: (statuses) => {
      set(statuses);
    }
  };
}
const coverageStatus = createCoverageStatus();
function createUserRole() {
  const { subscribe, set } = writable("media");
  return {
    subscribe,
    setRole: (role) => {
      set(role);
    }
  };
}
const userRole = createUserRole();
const isMedia = derived(userRole, ($role) => $role === "media");
const isSpectator = derived(userRole, ($role) => $role === "spectator");
const isCoach = derived(userRole, ($role) => $role === "coach");
const detectOpportunities = (allMatches, selectedMatchIds, conflicts, options = {}) => {
  const {
    excludeSelected = true,
    preferNoConflicts = true,
    preferNearSelected = true,
    maxResults = 10
  } = options;
  let candidates = excludeSelected ? allMatches.filter((m) => !selectedMatchIds.has(m.MatchId)) : allMatches;
  const scored = candidates.map((match) => {
    const reasons = [];
    let score = 0;
    const hasConflict = conflicts.has(match.MatchId);
    if (!hasConflict && preferNoConflicts) {
      score += 50;
      reasons.push("No conflicts");
    } else if (hasConflict) {
      score -= 20;
      reasons.push("Has conflicts");
    }
    if (preferNearSelected && selectedMatchIds.size > 0) {
      const matchStart = match.ScheduledStartDateTime;
      const matchEnd = match.ScheduledEndDateTime;
      const selectedMatches = allMatches.filter((m) => selectedMatchIds.has(m.MatchId));
      let minGap = Infinity;
      selectedMatches.forEach((selected) => {
        const selectedStart = selected.ScheduledStartDateTime;
        const selectedEnd = selected.ScheduledEndDateTime;
        const gapBefore = Math.abs(matchStart - selectedEnd);
        const gapAfter = Math.abs(selectedStart - matchEnd);
        const minGapForThis = Math.min(gapBefore, gapAfter);
        if (minGapForThis < minGap) {
          minGap = minGapForThis;
        }
      });
      if (minGap < 2 * 60 * 60 * 1e3) {
        score += 20;
        reasons.push("Near selected matches");
      } else if (minGap > 4 * 60 * 60 * 1e3) {
        score -= 10;
        reasons.push("Far from selected matches");
      }
    }
    if (preferNearSelected && selectedMatchIds.size > 0) {
      const selectedMatches = allMatches.filter((m) => selectedMatchIds.has(m.MatchId));
      const sameCourtCount = selectedMatches.filter((m) => m.CourtName === match.CourtName).length;
      if (sameCourtCount > 0) {
        score += 15;
        reasons.push("Same court as selected matches");
      }
    }
    const matchHour = new Date(match.ScheduledStartDateTime).getHours();
    if (matchHour >= 8 && matchHour < 12) {
      score += 5;
      reasons.push("Morning match");
    }
    return {
      match,
      score,
      reasons
    };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, maxResults).filter((opportunity) => opportunity.score > 0);
};
const generateCoverageSuggestions = (matches, selectedMatchIds, conflicts, coverageStatus2, getTeamIdentifier2, options = {}) => {
  const {
    excludeSelected = true,
    preferUncovered = true,
    preferNoConflicts = true,
    preferNearSelected = true,
    maxResults = 10
  } = options;
  const suggestions = [];
  matches.forEach((match) => {
    if (excludeSelected && selectedMatchIds.has(match.MatchId)) {
      return;
    }
    const teamId = getTeamIdentifier2(match);
    if (!teamId) return;
    const status = coverageStatus2.get(teamId) || "not-covered";
    const hasConflict = conflicts.has(match.MatchId);
    let score = 0;
    const reasons = [];
    if (preferUncovered && status === "not-covered") {
      score += 10;
      reasons.push("Uncovered team");
    }
    if (preferNoConflicts && !hasConflict) {
      score += 5;
      reasons.push("No conflicts");
    }
    if (preferNearSelected && selectedMatchIds.size > 0) {
      const matchStart = match.ScheduledStartDateTime;
      let isNearSelected = false;
      matches.forEach((m) => {
        if (selectedMatchIds.has(m.MatchId)) {
          const timeDiff = Math.abs(matchStart - m.ScheduledStartDateTime);
          const minutesDiff = timeDiff / 6e4;
          if (minutesDiff <= 30 && minutesDiff > 0) {
            isNearSelected = true;
          }
        }
      });
      if (isNearSelected) {
        score += 3;
        reasons.push("Near selected match");
      }
    }
    if (score > 0 && reasons.length > 0) {
      suggestions.push({
        match,
        teamId,
        reason: reasons.join(", "),
        score
      });
    }
  });
  return suggestions.sort((a, b) => b.score - a.score).slice(0, maxResults);
};
const DEFAULT_FILTERS = {
  division: null,
  wave: "all",
  teams: [],
  timeRange: {
    start: null,
    end: null
  },
  conflictsOnly: false,
  coverageStatus: "all",
  priority: "all",
  myTeamsOnly: false
  // Default to false - don't auto-filter by followed teams
};
function createFilters() {
  const { subscribe, set, update } = writable(DEFAULT_FILTERS);
  return {
    subscribe,
    updateFilter: (key, value) => {
      update((filters2) => {
        const next = { ...filters2, [key]: value };
        return next;
      });
    },
    resetFilters: () => {
      set(DEFAULT_FILTERS);
    },
    setTimeRangePreset: (preset) => {
      update((filters2) => {
        let next;
        if (preset === "morning") {
          next = {
            ...filters2,
            timeRange: { start: "00:00", end: "14:29" }
          };
        } else if (preset === "afternoon") {
          next = {
            ...filters2,
            timeRange: { start: "14:30", end: "23:59" }
          };
        } else {
          next = {
            ...filters2,
            timeRange: { start: null, end: null }
          };
        }
        return next;
      });
    },
    getTeamIdentifier: (match) => {
      const teamText = match.InvolvedTeam === "first" ? match.FirstTeamText : match.SecondTeamText;
      const matchResult = teamText.match(/(\d+-\d+)/);
      return matchResult ? matchResult[1] : "";
    }
  };
}
const filters = createFilters();
function getTeamIdentifier(match) {
  const teamText = match.InvolvedTeam === "first" ? match.FirstTeamText : match.SecondTeamText;
  const matchResult = teamText.match(/(\d+-\d+)/);
  return matchResult ? matchResult[1] : "";
}
function getUniqueDivisions(matches) {
  const divSet = new Set(matches.map((m) => m.Division.CodeAlias));
  return Array.from(divSet).sort();
}
function getUniqueTeams(matches) {
  const teamSet = /* @__PURE__ */ new Set();
  matches.forEach((match) => {
    const teamId = getTeamIdentifier(match);
    if (teamId) {
      teamSet.add(teamId);
    }
  });
  return Array.from(teamSet).sort();
}
function applyFilters(matches) {
  let currentFilters = DEFAULT_FILTERS;
  filters.subscribe((f) => {
    currentFilters = f;
  })();
  return matches.filter((match) => {
    if (currentFilters.division && match.Division.CodeAlias !== currentFilters.division) {
      return false;
    }
    if (currentFilters.wave !== "all") {
      const startTime = new Date(match.ScheduledStartDateTime).getTime();
      const startDate = new Date(startTime);
      const hours = startDate.getHours();
      const minutes = startDate.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      const afternoonStartMinutes = 14 * 60 + 30;
      if (currentFilters.wave === "morning" && totalMinutes >= afternoonStartMinutes) {
        return false;
      }
      if (currentFilters.wave === "afternoon" && totalMinutes < afternoonStartMinutes) {
        return false;
      }
    }
    if (currentFilters.teams.length > 0) {
      const teamId = getTeamIdentifier(match);
      if (!teamId || !currentFilters.teams.includes(teamId)) {
        return false;
      }
    }
    if (currentFilters.timeRange.start || currentFilters.timeRange.end) {
      const startTime = new Date(match.ScheduledStartDateTime).getTime();
      const startDate = new Date(startTime);
      const hours = startDate.getHours();
      const minutes = startDate.getMinutes();
      const matchTimeMinutes = hours * 60 + minutes;
      if (currentFilters.timeRange.start) {
        const [startH, startM] = currentFilters.timeRange.start.split(":").map(Number);
        const startFilterMinutes = startH * 60 + startM;
        if (matchTimeMinutes < startFilterMinutes) {
          return false;
        }
      }
      if (currentFilters.timeRange.end) {
        const [endH, endM] = currentFilters.timeRange.end.split(":").map(Number);
        const endFilterMinutes = endH * 60 + endM;
        if (matchTimeMinutes > endFilterMinutes) {
          return false;
        }
      }
    }
    return true;
  });
}
function updateFilter(key, value) {
  filters.updateFilter(key, value);
}
function createPriority() {
  const { subscribe, set, update } = writable({});
  return {
    subscribe,
    setPriority: (matchId, priority2) => {
      update((priorities) => {
        const next = { ...priorities };
        if (priority2 === null) {
          delete next[matchId];
        } else {
          next[matchId] = priority2;
        }
        return next;
      });
    },
    getPriority: (matchId) => {
      let priority2 = null;
      subscribe((priorities) => {
        priority2 = priorities[matchId] || null;
      })();
      return priority2;
    },
    clearAllPriorities: () => {
      set({});
    }
  };
}
const priority = createPriority();
function createFollowedTeams() {
  const { subscribe: subscribeTeams, set: setTeams, update: updateTeams } = writable([]);
  const { subscribe: subscribeColors, set: setColors, update: updateColors } = writable(/* @__PURE__ */ new Map());
  return {
    subscribe: subscribeTeams,
    followTeam: (teamId, teamName) => {
      updateTeams((teams) => {
        if (teams.some((t) => t.teamId === teamId)) {
          return teams;
        }
        const next = [...teams, { teamId, teamName, followedAt: Date.now() }];
        return next;
      });
    },
    unfollowTeam: (teamId) => {
      updateTeams((teams) => {
        const next = teams.filter((t) => t.teamId !== teamId);
        return next;
      });
      updateColors((colors) => {
        const next = new Map(colors);
        next.delete(teamId);
        return next;
      });
    },
    isFollowing: (teamId) => {
      let following = false;
      subscribeTeams((teams) => {
        following = teams.some((t) => t.teamId === teamId);
      })();
      return following;
    },
    setTeamColor: (teamId, color) => {
      updateColors((colors) => {
        const next = new Map(colors);
        next.set(teamId, color);
        return next;
      });
    },
    getTeamColor: (teamId) => {
      let color = null;
      subscribeColors((colors) => {
        color = colors.get(teamId) || null;
      })();
      return color;
    },
    reorderTeams: (teamId, direction) => {
      updateTeams((teams) => {
        const index = teams.findIndex((t) => t.teamId === teamId);
        if (index === -1) return teams;
        const newTeams = [...teams];
        const team = newTeams[index];
        if (direction === "top") {
          newTeams.splice(index, 1);
          newTeams.unshift(team);
        } else if (direction === "up" && index > 0) {
          [newTeams[index - 1], newTeams[index]] = [newTeams[index], newTeams[index - 1]];
        } else if (direction === "down" && index < newTeams.length - 1) {
          [newTeams[index], newTeams[index + 1]] = [newTeams[index + 1], newTeams[index]];
        }
        return newTeams;
      });
    }
  };
}
const followedTeams = createFollowedTeams();
const DEFAULT_PREFERENCES = {
  upcomingMatchReminder: true,
  reminderMinutes: 5,
  scoreUpdateNotification: true,
  browserNotifications: false
};
function createNotifications() {
  const { subscribe: subscribePrefs, set: setPrefs, update: updatePrefs } = writable(DEFAULT_PREFERENCES);
  const { subscribe: subscribePermission, set: setPermission } = writable(
    "default"
  );
  const showNotification = (title, body, useBrowser = false) => {
    return;
  };
  return {
    preferences: { subscribe: subscribePrefs },
    notificationPermission: { subscribe: subscribePermission },
    requestPermission: async () => {
      return false;
    },
    checkUpcomingMatches: (matches, followedTeamIds) => {
      let prefs = DEFAULT_PREFERENCES;
      subscribePrefs((p) => {
        prefs = p;
      })();
      if (!prefs.upcomingMatchReminder) return;
      const now = Date.now();
      const reminderTime = prefs.reminderMinutes * 60 * 1e3;
      matches.forEach((match) => {
        const matchTime = match.ScheduledStartDateTime;
        const timeUntilMatch = matchTime - now;
        const teamId = match.FirstTeamText || match.SecondTeamText;
        if (followedTeamIds.includes(teamId) && timeUntilMatch > 0 && timeUntilMatch <= reminderTime) {
          `reminder-${match.MatchId}`;
          {
            const minutesUntil = Math.floor(timeUntilMatch / 6e4);
            showNotification(
              `Match starting in ${minutesUntil} minute${minutesUntil !== 1 ? "s" : ""}`,
              `${match.FirstTeamText} vs ${match.SecondTeamText}
${new Date(matchTime).toLocaleTimeString()} - ${match.CourtName}`,
              prefs.browserNotifications
            );
          }
        }
      });
    },
    notifyScoreUpdate: (match, score) => {
      let prefs = DEFAULT_PREFERENCES;
      subscribePrefs((p) => {
        prefs = p;
      })();
      if (!prefs.scoreUpdateNotification) return;
      const currentSet = score.sets.find((s) => s.completedAt === 0) || score.sets[score.sets.length - 1];
      const completedSets = score.sets.filter((s) => s.completedAt > 0);
      const team1Wins = completedSets.filter((s) => s.team1Score > s.team2Score).length;
      const team2Wins = completedSets.filter((s) => s.team2Score > s.team1Score).length;
      let message = `Score: ${currentSet.team1Score}-${currentSet.team2Score}`;
      if (completedSets.length > 0) {
        message = `Sets: ${team1Wins}-${team2Wins} | ${message}`;
      }
      showNotification(
        `${match.FirstTeamText} vs ${match.SecondTeamText}`,
        message,
        prefs.browserNotifications
      );
    },
    updatePreferences: (newPreferences) => {
      updatePrefs((prev) => {
        const next = { ...prev, ...newPreferences };
        return next;
      });
    }
  };
}
const notifications = createNotifications();
const STORAGE_KEY = "claimHistory";
const MAX_HISTORY_ENTRIES = 1e3;
function addClaimHistory(entry) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const history = stored ? JSON.parse(stored) : [];
    history.unshift(entry);
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.splice(MAX_HISTORY_ENTRIES);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save claim history:", error);
  }
}
const CLAIM_EXPIRATION_BUFFER_MS = 30 * 60 * 1e3;
function createMatchClaiming({ eventId, userId = "anonymous" }) {
  const { subscribe: subscribeClaims, set: setClaims, update: updateClaims } = writable(/* @__PURE__ */ new Map());
  const { subscribe: subscribeScores, set: setScores, update: updateScores } = writable(/* @__PURE__ */ new Map());
  const startPolling = () => {
    return;
  };
  const stopPolling = () => {
  };
  return {
    claims: { subscribe: subscribeClaims },
    scores: { subscribe: subscribeScores },
    claimMatch: (matchId, matchEndTime) => {
      const now = Date.now();
      const expiresAt = matchEndTime + CLAIM_EXPIRATION_BUFFER_MS;
      const claim = {
        matchId,
        claimedBy: userId,
        claimedAt: now,
        expiresAt,
        eventId
      };
      updateClaims((claims) => {
        const next = new Map(claims);
        next.set(matchId, claim);
        return next;
      });
      addClaimHistory({
        matchId,
        eventId,
        action: "claimed",
        userId,
        timestamp: now
      });
    },
    releaseClaim: (matchId) => {
      updateClaims((claims) => {
        claims.get(matchId);
        const next = new Map(claims);
        next.delete(matchId);
        return next;
      });
    },
    transferClaim: (matchId, newUserId) => {
      let canTransfer = false;
      subscribeClaims((claims) => {
        const claim = claims.get(matchId);
        canTransfer = claim?.claimedBy === userId && claim.expiresAt > Date.now();
      })();
      if (!canTransfer) return false;
      const now = Date.now();
      updateClaims((claims) => {
        const claim = claims.get(matchId);
        if (!claim) return claims;
        const transferredClaim = {
          ...claim,
          claimedBy: newUserId,
          claimedAt: now
        };
        const next = new Map(claims);
        next.set(matchId, transferredClaim);
        return next;
      });
      return true;
    },
    isClaimed: (matchId) => {
      let claimed = false;
      subscribeClaims((claims) => {
        const claim = claims.get(matchId);
        claimed = claim ? claim.expiresAt > Date.now() : false;
      })();
      return claimed;
    },
    getClaimStatus: (matchId) => {
      let status = "available";
      subscribeClaims((claims) => {
        const claim = claims.get(matchId);
        if (!claim || claim.expiresAt < Date.now()) {
          status = "available";
        } else if (claim.claimedBy === userId) {
          status = "claimed";
        } else {
          status = "locked";
        }
      })();
      return status;
    },
    getClaimer: (matchId) => {
      let claimer = null;
      subscribeClaims((claims) => {
        const claim = claims.get(matchId);
        claimer = claim && claim.expiresAt > Date.now() ? claim.claimedBy : null;
      })();
      return claimer;
    },
    isClaimOwner: (matchId) => {
      let isOwner = false;
      subscribeClaims((claims) => {
        const claim = claims.get(matchId);
        isOwner = claim?.claimedBy === userId && claim.expiresAt > Date.now();
      })();
      return isOwner;
    },
    updateScore: (matchId, sets, status) => {
      const score = {
        matchId,
        eventId,
        sets,
        status,
        lastUpdated: Date.now(),
        lastUpdatedBy: userId
      };
      updateScores((scores) => {
        const next = new Map(scores);
        next.set(matchId, score);
        return next;
      });
    },
    getScore: (matchId) => {
      let score = null;
      subscribeScores((scores) => {
        score = scores.get(matchId) || null;
      })();
      return score;
    },
    clearEventData: () => {
      updateClaims((claims) => {
        const next = new Map(claims);
        next.forEach((claim, matchId) => {
          if (claim.eventId === eventId) {
            next.delete(matchId);
          }
        });
        return next;
      });
      updateScores((scores) => {
        const next = new Map(scores);
        next.forEach((score, matchId) => {
          if (score.eventId === eventId) {
            next.delete(matchId);
          }
        });
        return next;
      });
    },
    startPolling,
    stopPolling
  };
}
function createMatchNotes(eventId) {
  const { subscribe, set, update } = writable(/* @__PURE__ */ new Map());
  return {
    subscribe,
    setNote: (matchId, note) => {
      const now = Date.now();
      update((notes) => {
        const next = new Map(notes);
        const existing = next.get(matchId);
        if (note.trim()) {
          next.set(matchId, {
            matchId,
            eventId,
            note: note.trim(),
            createdAt: existing?.createdAt || now,
            updatedAt: now
          });
        } else {
          next.delete(matchId);
        }
        return next;
      });
    },
    getNote: (matchId) => {
      let note = "";
      subscribe((notes) => {
        note = notes.get(matchId)?.note || "";
      })();
      return note;
    },
    deleteNote: (matchId) => {
      update((notes) => {
        const next = new Map(notes);
        next.delete(matchId);
        return next;
      });
    },
    hasNote: (matchId) => {
      let has = false;
      subscribe((notes) => {
        const note = notes.get(matchId);
        has = note !== void 0 && note.note.trim().length > 0;
      })();
      return has;
    }
  };
}
function createMatchNotesStore(eventId) {
  return createMatchNotes(eventId);
}
function TeamDetailPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let allMatches, teamPools, relevantPools, matchesByDate;
    let match = $$props["match"];
    let eventId = $$props["eventId"];
    let clubId = $$props["clubId"];
    let onClose = $$props["onClose"];
    let matches = fallback($$props["matches"], () => [], true);
    let currentSchedule = [];
    let workSchedule = [];
    let futureSchedule = [];
    let divisionPlays = [];
    let selectedPlayId = null;
    function getTeamName() {
      if (match.InvolvedTeam === "first") {
        return match.FirstTeamText;
      } else if (match.InvolvedTeam === "second") {
        return match.SecondTeamText;
      }
      return "";
    }
    getTeamIdentifier(match);
    const teamName = getTeamName();
    allMatches = (() => {
      const matches2 = [
        ...currentSchedule.map((m) => ({ ...m, type: "current" })),
        ...workSchedule.map((m) => ({ ...m, type: "work" })),
        ...futureSchedule.map((m) => ({ ...m, type: "future" }))
      ].filter((match2, index, array) => {
        return array.findIndex((m) => m.MatchId === match2.MatchId) === index;
      }).sort((a, b) => {
        const timeA = typeof a.ScheduledStartDateTime === "string" ? new Date(a.ScheduledStartDateTime).getTime() : a.ScheduledStartDateTime || 0;
        const timeB = typeof b.ScheduledStartDateTime === "string" ? new Date(b.ScheduledStartDateTime).getTime() : b.ScheduledStartDateTime || 0;
        return timeA - timeB;
      });
      return matches2;
    })();
    teamPools = (() => {
      const poolSet = /* @__PURE__ */ new Set();
      allMatches.forEach((match2) => {
        if (match2.Division && match2.Division.PlayId) {
          const playId = Math.abs(match2.Division.PlayId);
          poolSet.add(playId);
        }
      });
      return Array.from(poolSet);
    })();
    relevantPools = (() => {
      return divisionPlays.filter((play) => {
        const normalizedPlayId = Math.abs(play.PlayId);
        return teamPools.includes(normalizedPlayId);
      });
    })();
    if (relevantPools.length > 0 && !selectedPlayId) {
      selectedPlayId = relevantPools[0].PlayId;
    }
    matchesByDate = (() => {
      const grouped = {};
      allMatches.forEach((match2) => {
        const startTime = typeof match2.ScheduledStartDateTime === "string" ? new Date(match2.ScheduledStartDateTime).getTime() : match2.ScheduledStartDateTime || 0;
        const dateKey = formatMatchDate(startTime);
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(match2);
      });
      return grouped;
    })();
    (() => {
      return Object.keys(matchesByDate).sort((a, b) => {
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        return dateA - dateB;
      });
    })();
    $$renderer2.push(`<div class="mt-8 border border-charcoal-700 rounded-lg bg-charcoal-800 overflow-hidden"><div class="p-4"><div class="flex items-center justify-between mb-6"><div><h4 class="text-sm sm:text-base font-semibold text-charcoal-50 truncate pr-2">Full Schedule</h4> `);
    if (teamName) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-xs text-charcoal-300 mt-1">${escape_html(teamName)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <button class="text-charcoal-300 hover:text-charcoal-50 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center" aria-label="Close panel"><svg class="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-center py-8 text-charcoal-300 text-sm">Loading schedule...</div>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div>`);
    bind_props($$props, { match, eventId, clubId, onClose, matches });
  });
}
function MatchDetailSheet($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let match = fallback($$props["match"], null);
    let eventId = $$props["eventId"];
    let clubId = $$props["clubId"];
    let matches = fallback($$props["matches"], () => [], true);
    let onClose = $$props["onClose"];
    let swipeOffset = 0;
    let isVisible = false;
    function handleClose() {
      isVisible = false;
      setTimeout(
        () => {
          onClose();
        },
        300
      );
    }
    onDestroy(() => {
      document.body.style.overflow = "";
    });
    if (match) {
      setTimeout(
        () => {
          isVisible = true;
        },
        10
      );
    } else {
      isVisible = false;
    }
    if (
      // Wait for animation before actually closing
      // Swipe down to dismiss
      // Reset swipe state
      // Max 200px swipe
      // Prevent body scroll when sheet is open
      match
    ) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div${attr_class("fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity", void 0, { "opacity-0": !isVisible, "opacity-100": isVisible })} role="dialog" aria-modal="true" aria-label="Match details" tabindex="-1"><div class="fixed bottom-0 left-0 right-0 top-0 bg-charcoal-950 overflow-y-auto transition-transform duration-300"${attr_style(`transform: translateY(${stringify(isVisible ? swipeOffset : "100%")}%);`)} role="dialog" tabindex="0"><div class="sticky top-0 bg-charcoal-950 border-b border-charcoal-700 px-4 py-3 flex items-center justify-between z-10 shadow-lg" style="padding-top: max(1rem, env(safe-area-inset-top));"><div class="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-charcoal-600 rounded-full"></div> <button type="button" class="ml-auto w-10 h-10 flex items-center justify-center rounded-lg text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-800 transition-colors min-h-[44px]" aria-label="Close match details"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div> <div class="pb-8" style="padding-bottom: max(2rem, env(safe-area-inset-bottom));">`);
      if (match) {
        $$renderer2.push("<!--[-->");
        TeamDetailPanel($$renderer2, { match, eventId, clubId, onClose: handleClose, matches });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { match, eventId, clubId, matches, onClose });
  });
}
function PrioritySelector($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let matchId = $$props["matchId"];
    let currentPriority = $$props["currentPriority"];
    let onPriorityChange = $$props["onPriorityChange"];
    let onClose = fallback($$props["onClose"], void 0);
    let hoveredPriority = null;
    const priorityOptions = [
      {
        value: "must-cover",
        label: "Must Cover",
        color: "#eab308",
        icon: "⭐"
      },
      {
        value: "priority",
        label: "Priority",
        color: "#f59e0b",
        icon: "🔸"
      },
      {
        value: "optional",
        label: "Optional",
        color: "#9fa2ab",
        icon: "○"
      },
      { value: null, label: "Clear", color: "#9fa2ab", icon: "✕" }
    ];
    $$renderer2.push(`<div class="bg-charcoal-800 border border-charcoal-700 rounded-lg p-2 shadow-lg min-w-[160px]"><div class="text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2 px-1">Set Priority</div> <div class="space-y-1"><!--[-->`);
    const each_array = ensure_array_like(priorityOptions);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let option = each_array[$$index];
      const isSelected = currentPriority === option.value;
      const isHovered = hoveredPriority === option.value;
      $$renderer2.push(`<button${attr_class(`w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${stringify(isSelected ? "bg-gold-500/20 text-[#facc15] border border-[#eab308]/50" : isHovered ? "bg-charcoal-700 text-charcoal-50" : "text-charcoal-200 hover:bg-charcoal-700")}`)}><span>${escape_html(option.icon)}</span> <span>${escape_html(option.label)}</span></button>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
    bind_props($$props, { matchId, currentPriority, onPriorityChange, onClose });
  });
}
function CoverageStatusSelector($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let teamId = $$props["teamId"];
    let currentStatus = $$props["currentStatus"];
    let onStatusChange = $$props["onStatusChange"];
    let onClose = fallback($$props["onClose"], void 0);
    let hoveredStatus = null;
    const statusOptions = [
      {
        value: "not-covered",
        label: "Not Covered",
        color: "#9fa2ab",
        icon: "○"
      },
      {
        value: "covered",
        label: "Covered",
        color: "#10b981",
        icon: "✓"
      },
      {
        value: "partially-covered",
        label: "Partially Covered",
        color: "#f59e0b",
        icon: "◐"
      },
      {
        value: "planned",
        label: "Planned",
        color: "#eab308",
        icon: "📋"
      }
    ];
    $$renderer2.push(`<div class="bg-charcoal-800 border border-charcoal-700 rounded-lg p-2 shadow-lg min-w-[180px]"><div class="text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2 px-1">Coverage Status</div> <div class="text-xs text-charcoal-200 mb-2 px-1">Team ${escape_html(teamId)}</div> <div class="space-y-1"><!--[-->`);
    const each_array = ensure_array_like(statusOptions);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let option = each_array[$$index];
      const isSelected = currentStatus === option.value;
      const isHovered = hoveredStatus === option.value;
      $$renderer2.push(`<button${attr_class(`w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${stringify(isSelected ? option.value === "covered" ? "bg-green-500/20 text-green-400 border border-green-500/50" : option.value === "planned" ? "bg-gold-500/20 text-[#facc15] border border-[#eab308]/50" : option.value === "partially-covered" ? "bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/50" : "bg-charcoal-700 text-charcoal-300 border border-charcoal-600" : isHovered ? "bg-charcoal-700 text-charcoal-50" : "text-charcoal-200 hover:bg-charcoal-700")}`)}><span>${escape_html(option.icon)}</span> <span>${escape_html(option.label)}</span></button>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
    bind_props($$props, { teamId, currentStatus, onStatusChange, onClose });
  });
}
function MatchClaimButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let claimStatus, claimer, isOwner;
    let match = $$props["match"];
    let eventId = $$props["eventId"];
    let onClaim = $$props["onClaim"];
    let onRelease = $$props["onRelease"];
    const matchClaiming = createMatchClaiming(eventId);
    claimStatus = matchClaiming.getClaimStatus(match.MatchId);
    claimer = matchClaiming.getClaimer(match.MatchId);
    isOwner = matchClaiming.isClaimOwner(match.MatchId);
    if (claimStatus === "locked") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="px-2 py-1 text-xs font-medium rounded bg-charcoal-700 text-charcoal-300 border border-charcoal-600">Claimed by ${escape_html(claimer)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (claimStatus === "claimed" && isOwner) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex items-center gap-1"><button class="px-2 py-1 text-xs font-medium rounded bg-charcoal-700 text-charcoal-200 hover:bg-charcoal-600 transition-colors border border-charcoal-600" title="Release claim">Release</button> <button class="px-2 py-1 text-xs font-medium rounded bg-charcoal-600 text-charcoal-200 hover:bg-charcoal-700 transition-colors border border-charcoal-600" title="Transfer claim to another scorer">Transfer</button></div> `);
        {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (claimStatus === "available") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<button class="px-2 py-1 text-xs font-medium rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors whitespace-nowrap" title="Claim this match for scoring">Claim Match</button>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { match, eventId, onClaim, onRelease });
  });
}
function ScoreHistory($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let matchId = $$props["matchId"];
    let history = [];
    onDestroy(() => {
    });
    if (history.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-center py-8 text-charcoal-300 text-sm">No score history available</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="space-y-2"><h3 class="text-sm font-semibold text-charcoal-50 mb-3">Score History</h3> <div class="space-y-2 max-h-64 overflow-y-auto"><!--[-->`);
      const each_array = ensure_array_like(history.slice().reverse());
      for (let index = 0, $$length = each_array.length; index < $$length; index++) {
        let entry = each_array[index];
        const completedSets = entry.sets.filter((s) => s.completedAt > 0);
        const team1SetsWon = completedSets.filter((s) => s.team1Score > s.team2Score).length;
        const team2SetsWon = completedSets.filter((s) => s.team2Score > s.team1Score).length;
        const currentSet = entry.sets.find((s) => s.completedAt === 0) || entry.sets[entry.sets.length - 1];
        $$renderer2.push(`<div class="px-3 py-2 rounded-lg border border-charcoal-700 bg-charcoal-800 text-xs"><div class="flex items-center justify-between mb-1"><div class="text-charcoal-300">${escape_html(new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }))}</div> <div${attr_class(`px-2 py-0.5 rounded text-[10px] font-medium ${stringify(entry.status === "completed" ? "bg-green-500/20 text-green-400" : entry.status === "in-progress" ? "bg-gold-500/20 text-[#facc15]" : "bg-charcoal-700 text-charcoal-300")}`)}>${escape_html(entry.status)}</div></div> `);
        if (completedSets.length > 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="text-charcoal-200 mb-1">Sets: ${escape_html(team1SetsWon)}-${escape_html(team2SetsWon)}</div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <div class="text-charcoal-50 font-semibold">Current: ${escape_html(currentSet.team1Score)}-${escape_html(currentSet.team2Score)}</div> <div class="text-[10px] text-charcoal-400 mt-1">Updated by ${escape_html(entry.updatedBy)}</div></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { matchId });
  });
}
function Scorekeeper($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let currentSet, completedSets;
    let matchId = $$props["matchId"];
    let team1Name = $$props["team1Name"];
    let team2Name = $$props["team2Name"];
    let currentScore = $$props["currentScore"];
    let onScoreUpdate = $$props["onScoreUpdate"];
    let onClose = $$props["onClose"];
    let sets = currentScore?.sets || [];
    let status = currentScore?.status || "not-started";
    let isSaving = false;
    onDestroy(() => {
    });
    if (sets.length === 0 && status === "not-started") {
      sets = [
        { setNumber: 1, team1Score: 0, team2Score: 0, completedAt: 0 }
      ];
    }
    currentSet = sets.find((s) => s.completedAt === 0) || sets[sets.length - 1];
    completedSets = sets.filter((s) => s.completedAt > 0);
    $$renderer2.push(`<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div class="bg-charcoal-800 rounded-lg border border-charcoal-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"><div class="sticky top-0 bg-charcoal-800 border-b border-charcoal-700 px-4 py-3 flex items-center justify-between"><div><h2 class="text-lg font-semibold text-charcoal-50">Scorekeeper</h2> <p class="text-sm text-charcoal-300">${escape_html(team1Name)} vs ${escape_html(team2Name)}</p></div> <button class="text-charcoal-300 hover:text-charcoal-50 transition-colors" aria-label="Close scorekeeper">✕</button></div> <div class="p-4 space-y-4"><div class="flex items-center gap-2"><span class="text-xs text-charcoal-300 uppercase tracking-wider">Status:</span> `);
    $$renderer2.select(
      {
        value: status,
        class: "px-3 py-1 text-sm font-medium rounded bg-charcoal-700 text-charcoal-200 border border-charcoal-600 focus:border-gold-500 focus:outline-none"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "not-started" }, ($$renderer4) => {
          $$renderer4.push(`Not Started`);
        });
        $$renderer3.option({ value: "in-progress" }, ($$renderer4) => {
          $$renderer4.push(`In Progress`);
        });
        $$renderer3.option({ value: "completed" }, ($$renderer4) => {
          $$renderer4.push(`Completed`);
        });
      }
    );
    $$renderer2.push(`</div> `);
    if (status === "not-started") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button class="w-full px-4 py-2 text-sm font-medium rounded bg-gold-500 text-charcoal-950 hover:bg-gold-400 transition-colors">Start Match</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (status === "in-progress" && currentSet) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bg-charcoal-700 rounded-lg border border-charcoal-600 p-4"><div class="text-xs text-charcoal-300 uppercase tracking-wider mb-2">Set ${escape_html(currentSet.setNumber)}</div> <div class="grid grid-cols-2 gap-4"><div class="text-center"><div class="text-xs text-charcoal-300 mb-1">${escape_html(team1Name)}</div> <div class="flex items-center justify-center gap-2"><button class="w-8 h-8 rounded bg-[#525463] text-charcoal-200 hover:bg-charcoal-700 transition-colors font-bold">−</button> <div class="text-3xl font-bold text-charcoal-50 w-12 text-center">${escape_html(currentSet.team1Score)}</div> <button class="w-8 h-8 rounded bg-[#525463] text-charcoal-200 hover:bg-charcoal-700 transition-colors font-bold">+</button></div></div> <div class="text-center"><div class="text-xs text-charcoal-300 mb-1">${escape_html(team2Name)}</div> <div class="flex items-center justify-center gap-2"><button class="w-8 h-8 rounded bg-[#525463] text-charcoal-200 hover:bg-charcoal-700 transition-colors font-bold">−</button> <div class="text-3xl font-bold text-charcoal-50 w-12 text-center">${escape_html(currentSet.team2Score)}</div> <button class="w-8 h-8 rounded bg-[#525463] text-charcoal-200 hover:bg-charcoal-700 transition-colors font-bold">+</button></div></div></div> <div class="flex gap-2 mt-4"><button class="flex-1 px-4 py-2 text-sm font-medium rounded bg-[#525463] text-charcoal-200 hover:bg-charcoal-700 transition-colors">Complete Set</button> `);
      if (sets.length < 5) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button class="flex-1 px-4 py-2 text-sm font-medium rounded bg-[#525463] text-charcoal-200 hover:bg-charcoal-700 transition-colors">Add Set</button>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (completedSets.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div><div class="text-xs text-charcoal-300 uppercase tracking-wider mb-2">Completed Sets</div> <div class="space-y-2"><!--[-->`);
      const each_array = ensure_array_like(completedSets);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let set = each_array[$$index];
        $$renderer2.push(`<div class="flex items-center justify-between px-3 py-2 bg-charcoal-700 rounded border border-charcoal-600"><span class="text-sm text-charcoal-300">Set ${escape_html(set.setNumber)}</span> <div class="flex items-center gap-4"><span class="text-sm font-medium text-charcoal-50">${escape_html(team1Name)}: ${escape_html(set.team1Score)}</span> <span class="text-sm text-charcoal-300">vs</span> <span class="text-sm font-medium text-charcoal-50">${escape_html(team2Name)}: ${escape_html(set.team2Score)}</span></div></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (status === "in-progress" && completedSets.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button class="w-full px-4 py-2 text-sm font-medium rounded bg-gold-500 text-charcoal-950 hover:bg-gold-400 transition-colors">Complete Match</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button${attr("disabled", isSaving, true)}${attr_class(`w-full px-4 py-2 text-sm font-medium rounded transition-colors border ${stringify("bg-charcoal-700 text-charcoal-200 hover:bg-charcoal-600 border-charcoal-600")}`)}>${escape_html("Save Score")}</button> `);
    if (status === "in-progress") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-xs text-charcoal-300 text-center">${escape_html("✓ Auto-save enabled")}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (currentScore) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="border-t border-charcoal-700 pt-4">`);
      ScoreHistory($$renderer2, { matchId });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div></div>`);
    bind_props($$props, {
      matchId,
      team1Name,
      team2Name,
      currentScore,
      onScoreUpdate,
      onClose
    });
  });
}
function LiveScoreIndicator($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isLive = $$props["isLive"];
    let lastUpdated = fallback($$props["lastUpdated"], void 0);
    let className = fallback($$props["className"], "");
    let hasUpdate = false;
    let timeoutId = null;
    onDestroy(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });
    if (lastUpdated) {
      hasUpdate = true;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => {
          hasUpdate = false;
        },
        2e3
      );
    }
    if (isLive) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div${attr_class(`flex items-center gap-1 ${stringify(className)}`)}><span${attr_class(`px-1.5 py-0.5 text-[10px] font-medium rounded border transition-all ${stringify(hasUpdate ? "bg-green-500/30 text-green-300 border-green-500/50 animate-pulse" : "bg-green-500/20 text-green-400 border-green-500/30")}`)}>LIVE</span> `);
      if (lastUpdated) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-[9px] text-[#9fa2ab] opacity-75">${escape_html(new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { isLive, lastUpdated, className });
  });
}
function MyTeamsSelector($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let matches = $$props["matches"];
    (() => {
      const teamMap = /* @__PURE__ */ new Map();
      matches.forEach((match) => {
        const teamId = match.FirstTeamText || match.SecondTeamText;
        if (teamId && !teamMap.has(teamId)) {
          teamMap.set(teamId, teamId);
        }
      });
      return Array.from(teamMap.entries()).map(([id, name]) => ({ id, name }));
    })();
    $$renderer2.push(`<div class="relative"><button class="px-3 py-2 text-sm font-medium rounded-lg bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 border border-charcoal-600 hover:border-[#eab308] transition-colors">My Teams (${escape_html(
      // Available colors for team customization
      // Gold
      // Blue
      // Green
      // Orange
      // Red
      // Purple
      // Pink
      // Cyan
      store_get($$store_subs ??= {}, "$followedTeams", followedTeams)?.length || 0
    )})</button> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { matches });
  });
}
function LiveMatchDashboard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let liveMatches;
    let matches = $$props["matches"];
    let eventId = $$props["eventId"];
    let userId = fallback($$props["userId"], void 0);
    let onMatchClick = fallback($$props["onMatchClick"], void 0);
    const matchClaiming = createMatchClaiming(eventId);
    liveMatches = (() => {
      const now = Date.now();
      return matches.filter((match) => {
        const matchStart = match.ScheduledStartDateTime;
        const matchEnd = match.ScheduledEndDateTime || matchStart + 90 * 60 * 1e3;
        const score = matchClaiming.getScore(match.MatchId);
        return score && score.status === "in-progress" || now >= matchStart && now <= matchEnd;
      });
    })();
    if (liveMatches.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="mb-6 rounded-lg border border-charcoal-700 bg-charcoal-800 p-4"><div class="flex items-center justify-between mb-4"><h2 class="text-lg font-semibold text-charcoal-50 flex items-center gap-2"><span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Live Now</h2> <span class="text-xs text-charcoal-300">${escape_html(liveMatches.length)} match${escape_html(liveMatches.length !== 1 ? "es" : "")} in progress</span></div> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"><!--[-->`);
      const each_array = ensure_array_like(liveMatches);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let match = each_array[$$index];
        const score = matchClaiming.getScore(match.MatchId);
        const currentSet = score?.sets.find((s) => s.completedAt === 0) || score?.sets[score?.sets.length - 1];
        const completedSets = score?.sets.filter((s) => s.completedAt > 0) || [];
        const team1Wins = completedSets.filter((s) => s.team1Score > s.team2Score).length;
        const team2Wins = completedSets.filter((s) => s.team2Score > s.team1Score).length;
        $$renderer2.push(`<div role="button" tabindex="0" class="px-4 py-3 rounded-lg border border-charcoal-600 bg-charcoal-700 hover:border-gold-500 transition-colors cursor-pointer"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><span class="text-xs font-medium text-[#facc15]">${escape_html(match.CourtName)}</span> `);
        LiveScoreIndicator($$renderer2, {
          isLive: score?.status === "in-progress" || false,
          lastUpdated: score?.lastUpdated
        });
        $$renderer2.push(`<!----></div> <div class="text-xs text-charcoal-300">${escape_html(formatMatchTime(match.ScheduledStartDateTime))}</div></div> <div class="space-y-1"><div class="text-sm font-semibold text-charcoal-50">${escape_html(match.FirstTeamText)}</div> <div class="text-xs text-charcoal-300">vs</div> <div class="text-sm font-semibold text-charcoal-50">${escape_html(match.SecondTeamText)}</div></div> `);
        if (score && score.status !== "not-started" && currentSet) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="mt-3 pt-3 border-t border-charcoal-600"><div class="flex items-center justify-between">`);
          if (completedSets.length > 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="text-xs text-charcoal-300">Sets: ${escape_html(team1Wins)}-${escape_html(team2Wins)}</div>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> <div class="text-lg font-bold text-[#facc15]">${escape_html(currentSet.team1Score)}-${escape_html(currentSet.team2Score)}</div></div></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { matches, eventId, userId, onMatchClick });
  });
}
function FilterBottomSheet($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let activeFilterCount;
    let divisions = $$props["divisions"];
    let teams = $$props["teams"];
    let open = fallback($$props["open"], false);
    let onClose = $$props["onClose"];
    let swipeOffset = 0;
    function getActiveFilterCount() {
      let count = 0;
      if (store_get($$store_subs ??= {}, "$filters", filters).wave !== "all") count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).division) count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).teams.length > 0) count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).priority && store_get($$store_subs ??= {}, "$filters", filters).priority !== "all") count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).coverageStatus && store_get($$store_subs ??= {}, "$filters", filters).coverageStatus !== "all") count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).conflictsOnly) count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).myTeamsOnly) count++;
      return count;
    }
    activeFilterCount = getActiveFilterCount();
    if (open) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity" role="dialog" aria-modal="true" aria-label="Filter matches" tabindex="0"><div class="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-charcoal-950 rounded-t-lg border-t border-charcoal-900 overflow-y-auto transform transition-transform backdrop-blur-sm"${attr_style(`backdrop-filter: blur(8px); transform: translateY(${stringify(swipeOffset)}px);`)} role="none"><div class="sticky top-0 bg-charcoal-950 border-b border-charcoal-900 px-4 py-3 flex items-center justify-between z-10"><div class="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-charcoal-600 rounded-full"></div> <h2 class="text-lg font-semibold text-charcoal-50 ml-auto">Filters</h2> <div class="flex items-center gap-2 ml-auto">`);
      if (activeFilterCount > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="px-2 py-1 rounded-full bg-gold-500 text-charcoal-950 text-xs font-medium">${escape_html(activeFilterCount)}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-900 transition-colors min-h-[44px]" aria-label="Close filters">×</button></div></div> <div class="p-4 space-y-4"><div><label for="wave-filter" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">Wave</label> <div class="flex gap-2"><button${attr_class(`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${stringify(store_get($$store_subs ??= {}, "$filters", filters).wave === "all" ? "bg-gold-500 text-charcoal-950" : "bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700")}`)}>All</button> <button${attr_class(`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${stringify(store_get($$store_subs ??= {}, "$filters", filters).wave === "morning" ? "bg-gold-500 text-charcoal-950" : "bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700")}`)}>Morning</button> <button${attr_class(`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${stringify(store_get($$store_subs ??= {}, "$filters", filters).wave === "afternoon" ? "bg-gold-500 text-charcoal-950" : "bg-charcoal-800 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-700")}`)}>Afternoon</button></div></div> <div><label for="division-filter" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">Division</label> `);
      $$renderer2.select(
        {
          id: "division-filter",
          value: store_get($$store_subs ??= {}, "$filters", filters).division || "",
          onchange: (e) => updateFilter("division", e.target.value || null),
          class: "w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-brand-500 focus:outline-none bg-charcoal-800 text-charcoal-50 border border-charcoal-700"
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "" }, ($$renderer4) => {
            $$renderer4.push(`All Divisions`);
          });
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(divisions);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let division = each_array[$$index];
            $$renderer3.option({ value: division }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(division)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
      $$renderer2.push(`</div> <div><label for="team-filter" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">Team</label> `);
      $$renderer2.select(
        {
          id: "team-filter",
          value: store_get($$store_subs ??= {}, "$filters", filters).teams[0] || "",
          onchange: (e) => updateFilter("teams", e.target.value ? [e.target.value] : []),
          class: "w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-brand-500 focus:outline-none bg-charcoal-800 text-charcoal-50 border border-charcoal-700"
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "" }, ($$renderer4) => {
            $$renderer4.push(`All Teams`);
          });
          $$renderer3.push(`<!--[-->`);
          const each_array_1 = ensure_array_like(teams);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let team = each_array_1[$$index_1];
            $$renderer3.option({ value: team }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(team)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
      $$renderer2.push(`</div> `);
      if (store_get($$store_subs ??= {}, "$userRole", userRole) === "media") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div><label for="priority-filter-sheet" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">Priority</label> `);
        $$renderer2.select(
          {
            id: "priority-filter-sheet",
            value: store_get($$store_subs ??= {}, "$filters", filters).priority || "all",
            onchange: (e) => updateFilter("priority", e.target.value === "all" ? null : e.target.value),
            class: "w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-brand-500 focus:outline-none bg-charcoal-800 text-charcoal-50 border border-charcoal-700"
          },
          ($$renderer3) => {
            $$renderer3.option({ value: "all" }, ($$renderer4) => {
              $$renderer4.push(`All Priorities`);
            });
            $$renderer3.option({ value: "must-cover" }, ($$renderer4) => {
              $$renderer4.push(`Must Cover`);
            });
            $$renderer3.option({ value: "priority" }, ($$renderer4) => {
              $$renderer4.push(`Priority`);
            });
            $$renderer3.option({ value: "optional" }, ($$renderer4) => {
              $$renderer4.push(`Optional`);
            });
          }
        );
        $$renderer2.push(`</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (store_get($$store_subs ??= {}, "$userRole", userRole) === "media") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div><label for="coverage-status-filter-sheet" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">Coverage Status</label> `);
        $$renderer2.select(
          {
            id: "coverage-status-filter-sheet",
            value: store_get($$store_subs ??= {}, "$filters", filters).coverageStatus || "all",
            onchange: (e) => updateFilter("coverageStatus", e.target.value === "all" ? null : e.target.value),
            class: "w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-brand-500 focus:outline-none bg-charcoal-800 text-charcoal-50 border border-charcoal-700"
          },
          ($$renderer3) => {
            $$renderer3.option({ value: "all" }, ($$renderer4) => {
              $$renderer4.push(`All Status`);
            });
            $$renderer3.option({ value: "uncovered" }, ($$renderer4) => {
              $$renderer4.push(`Uncovered`);
            });
            $$renderer3.option({ value: "planned" }, ($$renderer4) => {
              $$renderer4.push(`Planned`);
            });
            $$renderer3.option({ value: "covered" }, ($$renderer4) => {
              $$renderer4.push(`Covered`);
            });
          }
        );
        $$renderer2.push(`</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (store_get($$store_subs ??= {}, "$userRole", userRole) === "media") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox"${attr("checked", store_get($$store_subs ??= {}, "$filters", filters).conflictsOnly, true)} class="w-5 h-5 rounded border-charcoal-600 bg-charcoal-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-charcoal-950"/> <span class="text-sm text-charcoal-50">Show conflicts only</span></label></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="sticky bottom-0 bg-charcoal-950 border-t border-charcoal-900 px-4 py-3 flex gap-3"><button class="flex-1 px-4 py-2 rounded-lg bg-charcoal-800 text-charcoal-50 border border-charcoal-700 font-medium transition-colors hover:bg-charcoal-700 min-h-[44px]">Clear Filters</button> <button class="flex-1 px-4 py-2 rounded-lg bg-brand-500 text-white font-medium transition-colors hover:bg-brand-600 min-h-[44px]">Apply Filters</button></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { divisions, teams, open, onClose });
  });
}
function MatchCardMobile($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let teamId, opponent, matchPriority, teamCoverageStatus, isCovered, isPlanned, isUncovered, shouldDim, currentPlan, isSelected, isMediaValue, isSpectatorValue, cardClasses;
    let match = $$props["match"];
    let hasConflict = fallback($$props["hasConflict"], false);
    let onTap = $$props["onTap"];
    let onSwipeRight = fallback($$props["onSwipeRight"], null);
    let onSwipeLeft = fallback($$props["onSwipeLeft"], null);
    let scanningMode = fallback($$props["scanningMode"], false);
    let conflicts = $$props["conflicts"];
    let swipeOffset = 0;
    function getTeamId(match2) {
      const teamText = match2.InvolvedTeam === "first" ? match2.FirstTeamText : match2.SecondTeamText;
      const matchResult = teamText.match(/(\d+-\d+)/);
      return matchResult ? matchResult[1] : "";
    }
    function getOpponent(match2) {
      if (match2.InvolvedTeam === "first") return match2.SecondTeamText;
      if (match2.InvolvedTeam === "second") return match2.FirstTeamText;
      return `${match2.FirstTeamText} vs ${match2.SecondTeamText}`;
    }
    teamId = getTeamId(match);
    opponent = getOpponent(match);
    matchPriority = priority.getPriority(match.MatchId);
    teamCoverageStatus = teamId ? coverageStatus.getTeamStatus(teamId) : "not-covered";
    isCovered = teamCoverageStatus === "covered" || teamCoverageStatus === "partially-covered";
    isPlanned = teamCoverageStatus === "planned";
    isUncovered = teamCoverageStatus === "not-covered";
    shouldDim = scanningMode && isCovered;
    currentPlan = get(coveragePlan);
    isSelected = currentPlan.has(match.MatchId);
    isMediaValue = store_get($$store_subs ??= {}, "$isMedia", isMedia);
    isSpectatorValue = store_get($$store_subs ??= {}, "$isSpectator", isSpectator);
    cardClasses = [
      "relative rounded-xl px-4 py-3 min-h-[44px] transition-colors",
      hasConflict || matchPriority === "must-cover" ? "border-2" : "border",
      hasConflict ? "border-warning-500 bg-warning-500/10" : "",
      matchPriority === "must-cover" && !hasConflict ? "border-gold-500 bg-gold-500/10" : "",
      isPlanned && !hasConflict && matchPriority !== "must-cover" ? "border-gold-500/50 bg-gold-500/10" : "",
      isCovered && !hasConflict && !isPlanned && matchPriority !== "must-cover" ? "border-success-500/30 bg-success-500/5" : "",
      isUncovered && !hasConflict && !isPlanned && matchPriority !== "must-cover" && isSelected ? "border-gold-500 bg-gold-500/5" : "",
      !hasConflict && !isCovered && !isPlanned && !isSelected && matchPriority !== "must-cover" ? "border-charcoal-700 bg-charcoal-900" : "",
      "hover:border-charcoal-600 hover:bg-charcoal-800"
    ].filter(Boolean).join(" ");
    $$renderer2.push(`<div${attr_class("relative w-full rounded-xl transition-all duration-200 cursor-pointer touch-pan-y svelte-xjb0a1", void 0, { "opacity-30": shouldDim })}${attr_style(`transform: translateX(${stringify(swipeOffset * 0)}px);`)} role="button" tabindex="0" data-match-card=""${attr("data-match-id", match.MatchId)}>`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div${attr_class(clsx(cardClasses))}><div class="flex items-start gap-3"><div class="flex-shrink-0"><div class="px-2 py-1 rounded-lg bg-charcoal-700 text-charcoal-200 border border-charcoal-600 text-xs font-bold">${escape_html(formatMatchTime(match.ScheduledStartDateTime))}</div></div> <div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><div class="text-base font-bold text-charcoal-50 truncate">${escape_html(teamId || match.Division.CodeAlias)}</div> `);
    if (hasConflict) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="text-xs text-warning-500 flex-shrink-0">⚠️</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (matchPriority === "must-cover") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="text-xs text-gold-500 flex-shrink-0">⭐</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="text-sm text-charcoal-300 truncate mb-1">vs ${escape_html(opponent)}</div> <div class="flex items-center gap-2 mt-1"><span class="text-xs font-semibold text-charcoal-300">${escape_html(match.CourtName)}</span> <span class="text-xs text-charcoal-400">•</span> <span class="text-xs text-charcoal-400">${escape_html(match.Division.CodeAlias)}</span> `);
    if (teamCoverageStatus === "covered") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="text-xs text-success-500">✓ Covered</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (teamCoverageStatus === "partially-covered") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-xs text-warning-500">◐ Partial</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (teamCoverageStatus === "planned") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="text-xs text-gold-500">📋 Planned</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="flex-shrink-0 flex flex-col items-center gap-1">`);
    if (isMediaValue) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button type="button"${attr_class(`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors min-h-[44px] sm:min-h-0 ${stringify(isSelected ? "border-gold-500 bg-gold-500/20" : "border-charcoal-600 hover:bg-charcoal-700")}`)}${attr("aria-label", isSelected ? "Remove from plan" : "Add to plan")}>`);
      if (isSelected) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<svg class="w-4 h-4 text-gold-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<span class="text-xs text-charcoal-400">+</span>`);
      }
      $$renderer2.push(`<!--]--></button>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (isSpectatorValue) {
        $$renderer2.push("<!--[-->");
        if (teamId) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<button type="button"${attr_class("px-2 py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0", void 0, {
            "bg-gold-500": followedTeams.isFollowing(teamId),
            "text-charcoal-950": followedTeams.isFollowing(teamId),
            "bg-charcoal-700": !followedTeams.isFollowing(teamId),
            "text-charcoal-200": !followedTeams.isFollowing(teamId)
          })}${attr("title", followedTeams.isFollowing(teamId) ? "Unfollow team" : "Follow team")}>${escape_html(followedTeams.isFollowing(teamId) ? "✓" : "+")}</button>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, {
      match,
      hasConflict,
      onTap,
      onSwipeRight,
      onSwipeLeft,
      scanningMode,
      conflicts
    });
  });
}
function MatchList($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let activeFilterCount, conflicts, divisions, teams, coverageStatusMap, filteredMatches, opportunities, opportunityMatchIds, coverageStats, sortedMatches, matchesByStartTime, startTimes;
    let matches = $$props["matches"];
    let eventId = $$props["eventId"];
    let clubId = $$props["clubId"];
    let expandedMatch = null;
    let detailSheetMatch = null;
    let priorityMenuOpen = null;
    let coverageStatusMenuOpen = null;
    let scanningMode = false;
    let showSuggestions = false;
    let scorekeeperMatch = null;
    let previousClaimedMatchIds = /* @__PURE__ */ new Set();
    let showFilterSheet = false;
    function getActiveFilterCount() {
      let count = 0;
      if (store_get($$store_subs ??= {}, "$filters", filters).wave !== "all") count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).division) count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).teams.length > 0) count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).priority && store_get($$store_subs ??= {}, "$filters", filters).priority !== "all") count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).coverageStatus && store_get($$store_subs ??= {}, "$filters", filters).coverageStatus !== "all") count++;
      return count;
    }
    let matchClaiming;
    createMatchNotesStore(eventId);
    function getOpponent(match) {
      if (match.InvolvedTeam === "first") return match.SecondTeamText;
      if (match.InvolvedTeam === "second") return match.FirstTeamText;
      return `${match.FirstTeamText} vs ${match.SecondTeamText}`;
    }
    onDestroy(() => {
      matchClaiming.stopPolling();
    });
    activeFilterCount = getActiveFilterCount();
    {
      const isSpectatorValue = store_get($$store_subs ??= {}, "$isSpectator", isSpectator);
      matchClaiming = createMatchClaiming({
        eventId,
        userId: isSpectatorValue ? "spectator" : "anonymous"
      });
    }
    conflicts = detectConflicts(matches);
    divisions = (() => {
      if (store_get($$store_subs ??= {}, "$filters", filters).wave !== "all") {
        const waveStart = store_get($$store_subs ??= {}, "$filters", filters).wave === "morning" ? "08:00" : "14:30";
        const waveEnd = store_get($$store_subs ??= {}, "$filters", filters).wave === "morning" ? "14:30" : "23:59";
        return getUniqueDivisions(matches).filter((div) => {
          return matches.some((m) => {
            const matchTime = formatMatchTime(m.ScheduledStartDateTime);
            const timeOnly = matchTime.split(" ")[1] || matchTime;
            return timeOnly >= waveStart && timeOnly < waveEnd && m.Division.Name === div;
          });
        });
      }
      return getUniqueDivisions(matches);
    })();
    teams = getUniqueTeams(matches);
    coverageStatusMap = (() => {
      const map = /* @__PURE__ */ new Map();
      matches.forEach((match) => {
        const teamId = getTeamIdentifier(match);
        if (teamId) {
          map.set(teamId, coverageStatus.getTeamStatus(teamId));
        }
      });
      return map;
    })();
    (() => {
      const selectedSet = get(coveragePlan);
      return generateCoverageSuggestions(matches, selectedSet, conflicts, coverageStatusMap, getTeamIdentifier, {
        excludeSelected: true,
        preferUncovered: true,
        preferNoConflicts: true,
        preferNearSelected: true,
        maxResults: 10
      });
    })();
    filteredMatches = (() => {
      let filtered = applyFilters(matches);
      if (store_get($$store_subs ??= {}, "$filters", filters).priority && store_get($$store_subs ??= {}, "$filters", filters).priority !== "all") {
        filtered = filtered.filter((m) => {
          const matchPriority = priority.getPriority(m.MatchId);
          return matchPriority === store_get($$store_subs ??= {}, "$filters", filters).priority;
        });
      }
      if (store_get($$store_subs ??= {}, "$filters", filters).coverageStatus && store_get($$store_subs ??= {}, "$filters", filters).coverageStatus !== "all") {
        filtered = filtered.filter((m) => {
          const teamId = getTeamIdentifier(m);
          if (!teamId) return true;
          const status = coverageStatus.getTeamStatus(teamId);
          if (store_get($$store_subs ??= {}, "$filters", filters).coverageStatus === "uncovered") {
            return status === "not-covered";
          } else if (store_get($$store_subs ??= {}, "$filters", filters).coverageStatus === "covered") {
            return status === "covered" || status === "partially-covered";
          } else if (store_get($$store_subs ??= {}, "$filters", filters).coverageStatus === "planned") {
            return status === "planned";
          }
          return true;
        });
      }
      if (store_get($$store_subs ??= {}, "$isSpectator", isSpectator) && store_get($$store_subs ??= {}, "$filters", filters).myTeamsOnly) {
        let followedTeamIds = [];
        followedTeams.subscribe((teams2) => {
          followedTeamIds = teams2.map((t) => t.teamId);
        })();
        if (followedTeamIds.length > 0) {
          filtered = filtered.filter((m) => {
            const teamId = getTeamIdentifier(m);
            return teamId && followedTeamIds.includes(teamId);
          });
        }
      }
      return filtered;
    })();
    opportunities = (() => {
      const selectedSet = get(coveragePlan);
      return detectOpportunities(matches, selectedSet, conflicts, {
        excludeSelected: true,
        preferNoConflicts: true,
        preferNearSelected: true,
        maxResults: 50
      });
    })();
    opportunityMatchIds = new Set(opportunities.map((o) => o.match.MatchId));
    coverageStats = (() => {
      const teamStatusMap = /* @__PURE__ */ new Map();
      matches.forEach((match) => {
        const teamId = getTeamIdentifier(match);
        if (teamId) {
          const status = coverageStatus.getTeamStatus(teamId);
          teamStatusMap.set(teamId, status);
        }
      });
      const totalTeams = teamStatusMap.size;
      const coveredTeams = Array.from(teamStatusMap.values()).filter((s) => s === "covered").length;
      const partiallyCoveredTeams = Array.from(teamStatusMap.values()).filter((s) => s === "partially-covered").length;
      const plannedTeams = Array.from(teamStatusMap.values()).filter((s) => s === "planned").length;
      const uncoveredTeams = Array.from(teamStatusMap.values()).filter((s) => s === "not-covered").length;
      return {
        totalTeams,
        coveredTeams,
        partiallyCoveredTeams,
        plannedTeams,
        uncoveredTeams,
        coveragePercentage: totalTeams > 0 ? (coveredTeams + partiallyCoveredTeams) / totalTeams * 100 : 0
      };
    })();
    sortedMatches = (() => {
      let sorted = [...filteredMatches];
      {
        sorted.sort((a, b) => {
          const teamA = getTeamIdentifier(a);
          const teamB = getTeamIdentifier(b);
          return teamA.localeCompare(teamB);
        });
      }
      return sorted;
    })();
    matchesByStartTime = (() => {
      const grouped = {};
      sortedMatches.forEach((match) => {
        const startTime = formatMatchTime(match.ScheduledStartDateTime);
        if (!grouped[startTime]) {
          grouped[startTime] = [];
        }
        grouped[startTime].push(match);
      });
      return grouped;
    })();
    startTimes = (() => {
      return Object.keys(matchesByStartTime).sort((a, b) => {
        const timeA = (/* @__PURE__ */ new Date(`2000-01-01 ${a}`)).getTime();
        const timeB = (/* @__PURE__ */ new Date(`2000-01-01 ${b}`)).getTime();
        return timeA - timeB;
      });
    })();
    if (store_get($$store_subs ??= {}, "$isSpectator", isSpectator) && matches.length > 0) {
      const currentClaimed = /* @__PURE__ */ new Set();
      matches.forEach((match) => {
        if (matchClaiming.isClaimOwner(match.MatchId)) {
          currentClaimed.add(match.MatchId);
          if (!previousClaimedMatchIds.has(match.MatchId) && (!scorekeeperMatch || scorekeeperMatch.MatchId !== match.MatchId)) {
            setTimeout(
              () => {
                scorekeeperMatch = match;
              },
              200
            );
          }
        }
      });
      previousClaimedMatchIds = currentClaimed;
    }
    if (store_get($$store_subs ??= {}, "$isSpectator", isSpectator) && matches.length > 0) {
      let followedTeamIds = [];
      followedTeams.subscribe((teams2) => {
        followedTeamIds = teams2.map((t) => t.teamId);
      })();
      matches.forEach((match) => {
        const teamId = getTeamIdentifier(match);
        if (teamId && followedTeamIds.includes(teamId)) {
          const score = matchClaiming.getScore(match.MatchId);
          if (score && score.status === "in-progress") {
            notifications.notifyScoreUpdate(match, score);
          }
        }
      });
    }
    if (filteredMatches.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-center py-12 text-charcoal-300 text-sm">${escape_html(store_get($$store_subs ??= {}, "$filters", filters).division || store_get($$store_subs ??= {}, "$filters", filters).wave !== "all" || store_get($$store_subs ??= {}, "$filters", filters).teams.length > 0 ? "No matches found for selected filters" : "No matches found")}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div>`);
      if (store_get($$store_subs ??= {}, "$isSpectator", isSpectator)) {
        $$renderer2.push("<!--[-->");
        LiveMatchDashboard($$renderer2, {
          matches,
          eventId,
          userId: store_get($$store_subs ??= {}, "$isSpectator", isSpectator) ? "spectator" : "anonymous"
        });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (store_get($$store_subs ??= {}, "$isMedia", isMedia) && coverageStats.totalTeams > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="mb-4 px-4 py-2 rounded-lg border border-charcoal-700 bg-charcoal-800 flex items-center justify-between flex-wrap gap-2"><div class="flex items-center gap-4 flex-wrap"><div class="text-xs text-charcoal-300"><span class="font-semibold text-charcoal-50">${escape_html(coverageStats.coveragePercentage.toFixed(0))}%</span> Coverage</div> <div class="flex items-center gap-2 text-xs"><span class="text-green-400">✓ ${escape_html(coverageStats.coveredTeams)}</span> <span class="text-charcoal-300">/</span> <span class="text-[#f59e0b]">◐ ${escape_html(coverageStats.partiallyCoveredTeams)}</span> <span class="text-charcoal-300">/</span> <span class="text-gold-500">📋 ${escape_html(coverageStats.plannedTeams)}</span> <span class="text-charcoal-300">/</span> <span class="text-charcoal-400">○ ${escape_html(coverageStats.uncoveredTeams)}</span></div></div> `);
        if (store_get($$store_subs ??= {}, "$isMedia", isMedia)) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="mt-8 pt-6 border-t border-charcoal-700"><button${attr_class(`w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${stringify("bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 border border-charcoal-600")}`)} title="Dim covered teams to focus on uncovered">${escape_html("Scanning Mode")}</button></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (store_get($$store_subs ??= {}, "$isMedia", isMedia) && showSuggestions) ;
      else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (store_get($$store_subs ??= {}, "$isMedia", isMedia)) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="mb-4 px-3 py-2 rounded-lg border border-charcoal-700 bg-charcoal-800 text-xs" role="region" aria-label="Coverage status legend"><div class="font-medium text-charcoal-300 mb-2 flex items-center gap-2"><span>Coverage Status</span> <button type="button" class="w-4 h-4 rounded-full border border-charcoal-600 text-charcoal-400 hover:text-charcoal-200 hover:border-charcoal-500 transition-colors flex items-center justify-center text-[10px]" title="Coverage status indicates whether you've planned to photograph a team's matches" aria-label="Coverage status help">?</button></div> <div class="flex flex-wrap gap-4 text-charcoal-200"><div class="flex items-center gap-1.5"><div class="w-4 h-4 rounded border border-gold-500 bg-gold-500/5 flex items-center justify-center" aria-hidden="true"><span class="text-gold-500 text-xs">○</span></div> <span class="flex flex-col"><span class="font-medium text-charcoal-50">Uncovered</span> <span class="text-[10px] text-charcoal-400 hidden sm:inline">No matches planned</span></span></div> <div class="flex items-center gap-1.5"><div class="w-4 h-4 rounded border border-gold-500/50 bg-gold-500/10 flex items-center justify-center" aria-hidden="true"><span class="text-gold-500 text-xs">📋</span></div> <span class="flex flex-col"><span class="font-medium text-gold-400">Planned</span> <span class="text-[10px] text-charcoal-400 hidden sm:inline">On your schedule</span></span></div> <div class="flex items-center gap-1.5"><div class="w-4 h-4 rounded border border-green-500/30 bg-green-950/5 flex items-center justify-center" aria-hidden="true"><span class="text-success-500 text-xs">✓</span></div> <span class="flex flex-col"><span class="font-medium text-success-400">Covered</span> <span class="text-[10px] text-charcoal-400 hidden sm:inline">All matches planned</span></span></div> <div class="flex items-center gap-1.5"><div class="w-4 h-4 rounded border border-warning-500/50 bg-warning-500/10 flex items-center justify-center" aria-hidden="true"><span class="text-warning-500 text-xs">⚠</span></div> <span class="flex flex-col"><span class="font-medium text-warning-400">Conflict</span> <span class="text-[10px] text-charcoal-400 hidden sm:inline">Overlapping times</span></span></div></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4"><button class="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-brand-500 text-white shadow-lg flex items-center justify-center font-semibold z-[60] sm:hidden hover:bg-brand-600 transition-colors" aria-label="Open filters">Filters `);
      if (activeFilterCount > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error-500 text-charcoal-50 text-xs flex items-center justify-center">${escape_html(activeFilterCount)}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></button> <div class="hidden sm:flex lg:hidden flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"><div class="flex items-center gap-2"><span class="text-xs text-charcoal-300 uppercase tracking-wider">Sort:</span> <div class="flex gap-1 bg-charcoal-700 rounded-lg p-1"><button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify(
        "bg-gold-500 text-charcoal-950"
      )}`)}>Team</button> <button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify("text-charcoal-200 hover:text-charcoal-50")}`)}>Court</button> <button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify("text-charcoal-200 hover:text-charcoal-50")}`)}>Time</button></div></div> <div class="flex items-center gap-2"><span class="text-xs text-charcoal-300 uppercase tracking-wider">Wave:</span> <div class="flex gap-1 bg-charcoal-700 rounded-lg p-1"><button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify(store_get($$store_subs ??= {}, "$filters", filters).wave === "all" ? "bg-gold-500 text-charcoal-950" : "text-charcoal-200 hover:text-charcoal-50")}`)}>All</button> <button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify(store_get($$store_subs ??= {}, "$filters", filters).wave === "morning" ? "bg-gold-500 text-charcoal-950" : "text-charcoal-200 hover:text-charcoal-50")}`)}>Morning</button> <button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify(store_get($$store_subs ??= {}, "$filters", filters).wave === "afternoon" ? "bg-gold-500 text-charcoal-950" : "text-charcoal-200 hover:text-charcoal-50")}`)}>Afternoon</button></div></div> `);
      if (store_get($$store_subs ??= {}, "$isSpectator", isSpectator)) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex items-center gap-2">`);
        MyTeamsSelector($$renderer2, { matches });
        $$renderer2.push(`<!----></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="flex items-center gap-2 sm:hidden"><span class="text-xs text-charcoal-300 uppercase tracking-wider">Sort:</span> <div class="flex gap-1 bg-charcoal-700 rounded-lg p-1"><button${attr_class(`px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] ${stringify(
        "bg-gold-500 text-charcoal-950"
      )}`)}>Team</button> <button${attr_class(`px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] ${stringify("text-charcoal-200 hover:text-charcoal-50")}`)}>Court</button> <button${attr_class(`px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] ${stringify("text-charcoal-200 hover:text-charcoal-50")}`)}>Time</button></div></div></div> `);
      FilterBottomSheet($$renderer2, {
        divisions,
        teams,
        open: showFilterSheet,
        onClose: () => showFilterSheet = false
      });
      $$renderer2.push(`<!----> <div data-match-list="" class="space-y-4">`);
      if (startTimes.length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="text-center py-12 text-charcoal-300 text-sm">No matches found</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(startTimes);
        for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
          let startTime = each_array_1[$$index_2];
          const timeMatches = matchesByStartTime[startTime];
          const timeConflicts = timeMatches.filter((m) => conflicts.has(m.MatchId)).length;
          const hasAnyConflict = timeConflicts > 0;
          timeConflicts === timeMatches.length;
          $$renderer2.push(`<div class="space-y-2"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><h3 class="text-base font-bold text-charcoal-50">${escape_html(startTime)}</h3> <span class="text-xs text-charcoal-300">${escape_html(timeMatches.length)} match${escape_html(timeMatches.length !== 1 ? "es" : "")}</span></div> `);
          if (hasAnyConflict) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<span class="text-xs font-medium text-warning-500">${escape_html(timeConflicts)} conflict${escape_html(timeConflicts !== 1 ? "s" : "")}</span>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div> <div class="space-y-1"><!--[-->`);
          const each_array_2 = ensure_array_like(timeMatches);
          for (let index = 0, $$length2 = each_array_2.length; index < $$length2; index++) {
            let match = each_array_2[index];
            const hasConflict = conflicts.has(match.MatchId);
            const teamId = getTeamIdentifier(match);
            const opponent = getOpponent(match);
            const isExpanded = expandedMatch === match.MatchId;
            const matchPriority = priority.getPriority(match.MatchId);
            opportunityMatchIds.has(match.MatchId);
            const teamCoverageStatus = teamId ? coverageStatus.getTeamStatus(teamId) : "not-covered";
            const currentPlan = get(coveragePlan);
            const isSelected = currentPlan.has(match.MatchId);
            $$renderer2.push(`<div><div class="lg:hidden">`);
            MatchCardMobile($$renderer2, {
              match,
              hasConflict,
              conflicts,
              scanningMode,
              onTap: (m) => detailSheetMatch = m,
              onSwipeRight: store_get($$store_subs ??= {}, "$isMedia", isMedia) ? (m) => coveragePlan.toggleMatch(m.MatchId) : null,
              onSwipeLeft: null
            });
            $$renderer2.push(`<!----></div> <div${attr_class(`hidden lg:flex lg:items-center lg:gap-4 lg:py-2 lg:px-3 lg:border-b lg:border-charcoal-700 hover:bg-[#2a2a2f]/50 transition-colors cursor-pointer ${stringify("")}`)} data-match-card="" role="button" tabindex="0"><div class="flex-shrink-0 w-16"><div class="text-base font-bold text-charcoal-50 leading-tight">${escape_html(teamId || match.Division.CodeAlias)}</div> <div class="text-xs text-charcoal-300 leading-tight mt-0.5">${escape_html(match.Division.CodeAlias)}</div></div> <div class="flex-shrink-0 w-28"><div class="text-base font-bold text-[#facc15] leading-tight">${escape_html(match.CourtName)}</div></div> <div class="flex-1 min-w-0"><div class="flex items-center gap-2">`);
            if (store_get($$store_subs ??= {}, "$isSpectator", isSpectator) && teamId) {
              $$renderer2.push("<!--[-->");
              const teamColor = followedTeams.getTeamColor(teamId);
              if (teamColor) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="w-3 h-3 rounded-full flex-shrink-0"${attr_style(`background-color: ${stringify(teamColor)};`)}${attr("title", `${stringify(teamId)} (followed)`)}></div>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]-->`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> <div class="text-sm text-charcoal-200 truncate">vs ${escape_html(opponent)}</div> `);
            if (hasConflict) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<span class="text-xs text-warning-500 flex-shrink-0">⚠️</span>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></div></div> <div class="flex items-center gap-2 flex-shrink-0">`);
            if (store_get($$store_subs ??= {}, "$isMedia", isMedia)) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<button${attr_class(`flex-shrink-0 w-5 h-5 rounded border-2 ${stringify(isSelected ? "border-gold-500 bg-gold-500/20" : "border-charcoal-600 bg-transparent")} flex items-center justify-center hover:bg-charcoal-700 transition-colors`)}${attr("aria-label", isSelected ? "Remove from plan" : "Add to plan")}>`);
              if (isSelected) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<svg class="w-3 h-3 text-[#facc15]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`);
              } else {
                $$renderer2.push("<!--[!-->");
                $$renderer2.push(`<span class="text-xs text-charcoal-300">+</span>`);
              }
              $$renderer2.push(`<!--]--></button>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> `);
            if (store_get($$store_subs ??= {}, "$isMedia", isMedia)) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="relative"><button${attr_class(`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-charcoal-700 ${stringify(matchPriority === "must-cover" ? "text-gold-500" : matchPriority === "priority" ? "text-[#f59e0b]" : matchPriority === "optional" ? "text-charcoal-300" : "text-charcoal-400")}`)} aria-label="Set priority"${attr("title", matchPriority ? `Priority: ${matchPriority}` : "Set priority")}>${escape_html(matchPriority === "must-cover" && "⭐")}
													${escape_html(matchPriority === "priority" && "🔸")}
													${escape_html(matchPriority === "optional" && "○")} `);
              if (!matchPriority) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--></button> `);
              if (priorityMenuOpen === match.MatchId) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="absolute right-0 top-8 z-50">`);
                PrioritySelector($$renderer2, {
                  matchId: match.MatchId,
                  currentPriority: matchPriority,
                  onPriorityChange: priority.setPriority,
                  onClose: () => priorityMenuOpen = null
                });
                $$renderer2.push(`<!----></div>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--></div>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> `);
            if (store_get($$store_subs ??= {}, "$isMedia", isMedia) && teamId) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="relative"><button${attr_class(`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-charcoal-700 ${stringify(teamCoverageStatus === "covered" ? "text-green-500" : teamCoverageStatus === "partially-covered" ? "text-[#f59e0b]" : teamCoverageStatus === "planned" ? "text-gold-500" : "text-charcoal-400")}`)} aria-label="Set coverage status"${attr("title", `Coverage: ${stringify(teamCoverageStatus)}`)}>${escape_html(teamCoverageStatus === "covered" && "✓")}
													${escape_html(teamCoverageStatus === "partially-covered" && "◐")}
													${escape_html(teamCoverageStatus === "planned" && "📋")}
													${escape_html(teamCoverageStatus === "not-covered" && "○")}</button> `);
              if (coverageStatusMenuOpen === teamId) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="absolute right-0 top-8 z-50">`);
                CoverageStatusSelector($$renderer2, {
                  teamId,
                  currentStatus: teamCoverageStatus,
                  onStatusChange: coverageStatus.setTeamStatus,
                  onClose: () => coverageStatusMenuOpen = null
                });
                $$renderer2.push(`<!----></div>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--></div>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> `);
            if (store_get($$store_subs ??= {}, "$isSpectator", isSpectator)) {
              $$renderer2.push("<!--[-->");
              const score = matchClaiming.getScore(match.MatchId);
              const claimStatus = matchClaiming.getClaimStatus(match.MatchId);
              const isOwner = matchClaiming.isClaimOwner(match.MatchId);
              if (teamId) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<button${attr_class(`flex-shrink-0 px-2 py-1 text-xs font-medium rounded transition-colors ${stringify(followedTeams.isFollowing(teamId) ? "bg-gold-500 text-charcoal-950" : "bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 border border-charcoal-600")}`)}${attr("title", followedTeams.isFollowing(teamId) ? "Unfollow team" : "Follow team")}>${escape_html(followedTeams.isFollowing(teamId) ? "✓" : "+")}</button>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--> <div class="flex-shrink-0">`);
              MatchClaimButton($$renderer2, {
                match,
                eventId,
                onClaim: (matchId) => {
                  const claimedMatch = matches.find((m) => m.MatchId === matchId);
                  if (claimedMatch) {
                    setTimeout(
                      () => {
                        scorekeeperMatch = claimedMatch;
                      },
                      300
                    );
                  }
                },
                onRelease: () => {
                  scorekeeperMatch = null;
                }
              });
              $$renderer2.push(`<!----></div> `);
              if (claimStatus === "claimed" && isOwner) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<button class="flex-shrink-0 px-2 py-1 text-xs font-medium rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors whitespace-nowrap" title="Start keeping score for this match">${escape_html(score ? "Update Score" : "Start Scoring")}</button>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--> `);
              if (score && score.status !== "not-started") {
                $$renderer2.push("<!--[-->");
                LiveScoreIndicator($$renderer2, { match, matchClaiming });
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]-->`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></div></div> `);
            if (isExpanded && expandedMatch === match.MatchId) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="hidden lg:block mt-8">`);
              TeamDetailPanel($$renderer2, {
                match,
                eventId,
                clubId,
                onClose: () => expandedMatch = null,
                matches
              });
              $$renderer2.push(`<!----></div>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></div>`);
          }
          $$renderer2.push(`<!--]--></div></div>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div> `);
      MatchDetailSheet($$renderer2, {
        match: detailSheetMatch,
        eventId,
        clubId,
        matches,
        onClose: () => detailSheetMatch = null
      });
      $$renderer2.push(`<!----> `);
      if (scorekeeperMatch && matchClaiming.isClaimOwner(scorekeeperMatch.MatchId)) {
        $$renderer2.push("<!--[-->");
        Scorekeeper($$renderer2, {
          matchId: scorekeeperMatch.MatchId,
          team1Name: scorekeeperMatch.FirstTeamText,
          team2Name: scorekeeperMatch.SecondTeamText,
          currentScore: matchClaiming.getScore(scorekeeperMatch.MatchId),
          onScoreUpdate: (sets, status) => {
            matchClaiming.updateScore(scorekeeperMatch.MatchId, sets, status);
          },
          onClose: () => scorekeeperMatch = null
        });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (store_get($$store_subs ??= {}, "$isSpectator", isSpectator)) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="fixed bottom-4 right-4 z-50"><div class="relative"><button class="px-4 py-2 text-sm font-medium rounded-lg bg-charcoal-700 text-charcoal-200 hover:bg-charcoal-600 hover:text-charcoal-50 transition-colors shadow-lg flex items-center gap-2 border border-charcoal-600" title="Score sharing &amp; sync options"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Scores</button> `);
        {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div> `);
        {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { matches, eventId, clubId });
  });
}
const AVAILABLE_COLORS = [
  "#eab308",
  // Gold
  "#3b82f6",
  // Blue
  "#10b981",
  // Green
  "#f59e0b",
  // Orange
  "#8b5cf6",
  // Purple
  "#ec4899",
  // Pink
  "#06b6d4",
  // Cyan
  "#f97316"
  // Red-Orange
];
function createTeamCoordination() {
  const { subscribe: subscribeMembers, set: setMembers, update: updateMembers } = writable([]);
  const { subscribe: subscribeAssignments, set: setAssignments, update: updateAssignments } = writable(/* @__PURE__ */ new Map());
  const { subscribe: subscribeCurrentMember, set: setCurrentMember } = writable(
    null
  );
  const saveAssignments = (assignments) => {
    return;
  };
  return {
    members: { subscribe: subscribeMembers },
    assignments: { subscribe: subscribeAssignments },
    currentMemberId: { subscribe: subscribeCurrentMember },
    setCurrentMemberId: (memberId) => {
      setCurrentMember(memberId);
    },
    addMember: (name) => {
      let usedColors = /* @__PURE__ */ new Set();
      subscribeMembers((members) => {
        usedColors = new Set(members.map((m) => m.color));
      })();
      const availableColor = AVAILABLE_COLORS.find((c) => !usedColors.has(c)) || AVAILABLE_COLORS[0];
      const newMember = {
        id: `member-${Date.now()}`,
        name,
        color: availableColor,
        createdAt: Date.now()
      };
      updateMembers((members) => {
        const next = [...members, newMember];
        return next;
      });
      setCurrentMember(newMember.id);
      return newMember.id;
    },
    removeMember: (memberId) => {
      updateMembers((members) => {
        const next = members.filter((m) => m.id !== memberId);
        return next;
      });
      updateAssignments((assignments) => {
        const next = new Map(assignments);
        Array.from(next.entries()).forEach(([teamId, assignedMemberId]) => {
          if (assignedMemberId === memberId) {
            next.delete(teamId);
          }
        });
        return next;
      });
      subscribeMembers((members) => {
        if (members.length > 0) {
          setCurrentMember(members[0].id);
        }
      })();
    },
    updateMember: (memberId, updates) => {
      updateMembers((members) => {
        const next = members.map((m) => m.id === memberId ? { ...m, ...updates } : m);
        return next;
      });
    },
    assignTeam: (teamId, memberId) => {
      updateAssignments((assignments) => {
        const next = new Map(assignments);
        next.set(teamId, memberId);
        return next;
      });
    },
    unassignTeam: (teamId) => {
      updateAssignments((assignments) => {
        const next = new Map(assignments);
        next.delete(teamId);
        return next;
      });
    },
    getTeamAssignment: (teamId) => {
      let assignment = null;
      subscribeAssignments((assignments) => {
        assignment = assignments.get(teamId) || null;
      })();
      return assignment;
    },
    getMember: (memberId) => {
      let member = null;
      subscribeMembers((members) => {
        member = members.find((m) => m.id === memberId) || null;
      })();
      return member;
    },
    getCurrentMember: () => {
      let currentId = null;
      subscribeCurrentMember((id) => {
        currentId = id;
      })();
      if (!currentId) return null;
      let member = null;
      subscribeMembers((members) => {
        member = members.find((m) => m.id === currentId) || null;
      })();
      return member;
    },
    exportCoverageStatus: (coverageStatus2, memberId) => {
      let currentId = null;
      subscribeCurrentMember((id) => {
        currentId = id;
      })();
      const memberToExport = memberId || currentId;
      if (!memberToExport) return JSON.stringify({});
      let member = null;
      subscribeMembers((members) => {
        member = members.find((m) => m.id === memberToExport) || null;
      })();
      let assignments = /* @__PURE__ */ new Map();
      subscribeAssignments((assigns) => {
        assignments = assigns;
      })();
      const memberAssignments = Array.from(assignments.entries()).filter(([_, assignedMemberId]) => assignedMemberId === memberToExport).map(([teamId]) => teamId);
      const memberCoverageStatus = {};
      Array.from(coverageStatus2.entries()).forEach(([teamId, status]) => {
        if (memberAssignments.includes(teamId)) {
          memberCoverageStatus[teamId] = status;
        }
      });
      const data = {
        memberId: memberToExport,
        memberName: member?.name || "Unknown",
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        assignments: memberAssignments.map((teamId) => ({ teamId })),
        coverageStatus: memberCoverageStatus
      };
      return JSON.stringify(data, null, 2);
    },
    importCoverageStatus: (jsonData, mergeStrategy = "merge") => {
      try {
        const data = JSON.parse(jsonData);
        if (!data.coverageStatus || !data.memberId) {
          return {
            success: false,
            error: "Invalid data format: missing coverageStatus or memberId"
          };
        }
        if (mergeStrategy === "merge" && data.assignments) {
          updateAssignments((assignments) => {
            const next = new Map(assignments);
            data.assignments.forEach((assignment) => {
              next.set(assignment.teamId, data.memberId);
            });
            saveAssignments(next);
            return next;
          });
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    },
    mergeCoverageStatuses: (statuses) => {
      const merged = /* @__PURE__ */ new Map();
      statuses.forEach(({ coverageStatus: coverageStatus2 }) => {
        Object.entries(coverageStatus2).forEach(([teamId, status]) => {
          const currentStatus = merged.get(teamId);
          if (!currentStatus) {
            merged.set(teamId, status);
          } else {
            const priority2 = {
              covered: 3,
              "partially-covered": 2,
              planned: 1,
              "not-covered": 0
            };
            if (priority2[status] > priority2[currentStatus]) {
              merged.set(teamId, status);
            }
          }
        });
      });
      return merged;
    }
  };
}
createTeamCoordination();
function CoveragePlanPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let selectedMatchesList, planConflicts, coverageAwareOpportunities, conflictGroups, totalCoverageTime, matchesByDate, sortedDates;
    let matches = $$props["matches"];
    let onClose = $$props["onClose"];
    let swipeOffset = 0;
    let activeTab = "plan";
    let coverageStatusFilter = "all";
    let coverageStatusMenuOpen = null;
    let currentConflictIndex = 0;
    let conflictRefs = [];
    function getMatchConflicts(matchId) {
      const conflictIds = planConflicts.get(matchId) || [];
      return conflictIds.map((id) => selectedMatchesList.find((m) => m.MatchId === id)).filter(Boolean);
    }
    onDestroy(() => {
      document.body.style.overflow = "";
    });
    function getOpponent(m) {
      if (m.InvolvedTeam === "first") return m.SecondTeamText;
      if (m.InvolvedTeam === "second") return m.FirstTeamText;
      return `${m.FirstTeamText} vs ${m.SecondTeamText}`;
    }
    if (matches.length > 0) {
      const teamMatches = /* @__PURE__ */ new Map();
      const currentPlan = get(coveragePlan);
      matches.forEach((match) => {
        const teamId = getTeamIdentifier(match);
        if (!teamId) return;
        const stats = teamMatches.get(teamId) || { total: 0, inPlan: 0 };
        stats.total++;
        if (currentPlan.has(match.MatchId)) {
          stats.inPlan++;
        }
        teamMatches.set(teamId, stats);
      });
      teamMatches.forEach((stats, teamId) => {
        coverageStatus.updateFromPlan(teamId, stats.inPlan, stats.total);
      });
    }
    selectedMatchesList = (() => {
      const currentPlan = get(coveragePlan);
      let filtered = matches.filter((m) => currentPlan.has(m.MatchId)).sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime);
      if (coverageStatusFilter !== "all") {
        filtered = filtered.filter((match) => {
          const teamId = getTeamIdentifier(match);
          if (!teamId) return false;
          const status = coverageStatus.getTeamStatus(teamId);
          return status === coverageStatusFilter;
        });
      }
      return filtered;
    })();
    planConflicts = detectConflicts(selectedMatchesList);
    coverageAwareOpportunities = (() => {
      const conflicts = detectConflicts(matches);
      const currentPlan = get(coveragePlan);
      const selectedSet = currentPlan;
      const coverageStatusMap = /* @__PURE__ */ new Map();
      matches.forEach((match) => {
        const teamId = getTeamIdentifier(match);
        if (teamId) {
          coverageStatusMap.set(teamId, coverageStatus.getTeamStatus(teamId));
        }
      });
      return generateCoverageSuggestions(matches, selectedSet, conflicts, coverageStatusMap, getTeamIdentifier, {
        preferUncovered: true,
        preferNoConflicts: true,
        preferNearSelected: true,
        maxResults: 5
      });
    })();
    conflictGroups = (() => {
      if (planConflicts.size === 0) return [];
      const groups = [];
      const processed = /* @__PURE__ */ new Set();
      selectedMatchesList.forEach((match) => {
        if (processed.has(match.MatchId)) return;
        const conflictIds = planConflicts.get(match.MatchId);
        if (!conflictIds || conflictIds.length === 0) return;
        const conflictMatches = [
          match,
          ...conflictIds.map((id) => selectedMatchesList.find((m) => m.MatchId === id)).filter(Boolean)
        ];
        conflictMatches.forEach((m) => processed.add(m.MatchId));
        groups.push({
          matches: conflictMatches.sort((a, b) => a.ScheduledStartDateTime - b.ScheduledStartDateTime),
          conflictCount: conflictMatches.length
        });
      });
      return groups;
    })();
    if (conflictGroups.length > 0 && currentConflictIndex >= conflictGroups.length) {
      currentConflictIndex = 0;
    } else if (conflictGroups.length === 0) {
      currentConflictIndex = 0;
    }
    if (conflictGroups.length > 0 && conflictRefs[currentConflictIndex]) {
      setTimeout(
        () => {
          conflictRefs[currentConflictIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
        100
      );
    }
    totalCoverageTime = (() => {
      if (selectedMatchesList.length === 0) return 0;
      const earliest = Math.min(...selectedMatchesList.map((m) => m.ScheduledStartDateTime));
      const latest = Math.max(...selectedMatchesList.map((m) => m.ScheduledEndDateTime));
      return Math.floor((latest - earliest) / 6e4);
    })();
    matchesByDate = (() => {
      const grouped = {};
      selectedMatchesList.forEach((match) => {
        const dateKey = formatMatchDate(match.ScheduledStartDateTime);
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(match);
      });
      return grouped;
    })();
    sortedDates = (() => {
      return Object.keys(matchesByDate).sort((a, b) => {
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        return dateA - dateB;
      });
    })();
    $$renderer2.push(`<div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity lg:flex lg:items-center lg:justify-center lg:p-4" role="dialog" aria-modal="true" aria-label="Coverage plan" tabindex="-1"><div class="fixed bottom-0 left-0 right-0 max-h-[90vh] lg:relative lg:max-w-3xl lg:max-h-[90vh] lg:rounded-lg border border-charcoal-700 lg:border-t bg-charcoal-800 lg:bg-charcoal-800 overflow-hidden flex flex-col transform transition-transform lg:transform-none"${attr_style(`transform: translateY(${stringify(
      // Export handlers
      swipeOffset
    )}px); padding-bottom: env(safe-area-inset-bottom);`)} role="dialog" tabindex="-1"><div class="sticky top-0 bg-charcoal-700/50 lg:bg-charcoal-700/50 border-b border-charcoal-700 px-4 py-3 flex items-center justify-between z-10"><div class="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-charcoal-600 rounded-full lg:hidden"></div> <div class="flex-1 ml-auto lg:ml-0"><h3 class="text-base sm:text-lg font-semibold text-charcoal-50">My Coverage Plan</h3> <div class="flex items-center gap-3 mt-1 flex-wrap"><p class="text-xs text-charcoal-300">${escape_html(selectedMatchesList.length)} match${escape_html(selectedMatchesList.length !== 1 ? "es" : "")} selected `);
    if (totalCoverageTime > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`• ${escape_html(Math.floor(totalCoverageTime / 60))}h ${escape_html(totalCoverageTime % 60)}m coverage`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (conflictGroups.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="ml-2 text-red-400">• ${escape_html(conflictGroups.length)} conflict${escape_html(conflictGroups.length !== 1 ? "s" : "")}</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></p> `);
    $$renderer2.select(
      {
        id: "coverage-status-filter-panel",
        value: coverageStatusFilter,
        onchange: (e) => coverageStatusFilter = e.target.value,
        class: "px-2 py-1 text-xs rounded bg-charcoal-700 text-charcoal-200 border border-charcoal-600 focus:border-brand-500 focus:outline-none"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "all" }, ($$renderer4) => {
          $$renderer4.push(`All Status`);
        });
        $$renderer3.option({ value: "not-covered" }, ($$renderer4) => {
          $$renderer4.push(`Uncovered`);
        });
        $$renderer3.option({ value: "planned" }, ($$renderer4) => {
          $$renderer4.push(`Planned`);
        });
        $$renderer3.option({ value: "covered" }, ($$renderer4) => {
          $$renderer4.push(`Covered`);
        });
      }
    );
    $$renderer2.push(`</div></div> `);
    if (selectedMatchesList.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex items-center gap-1 bg-charcoal-800 rounded-lg p-1 border border-charcoal-700 mx-4 overflow-x-auto scrollbar-hide svelte-1r7fm91"><button type="button"${attr_class(`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] lg:min-h-0 ${stringify(
        "bg-gold-500 text-charcoal-950"
      )}`)}>Plan</button> <button type="button"${attr_class(`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] lg:min-h-0 ${stringify("text-charcoal-200 hover:text-charcoal-50")}`)}>Analytics</button> <button type="button"${attr_class(`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] lg:min-h-0 ${stringify("text-charcoal-200 hover:text-charcoal-50")}`)}>Stats</button> <button type="button"${attr_class(`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] lg:min-h-0 ${stringify("text-charcoal-200 hover:text-charcoal-50")}`)}>Team</button></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button type="button" class="text-charcoal-300 hover:text-charcoal-50 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 flex items-center justify-center" aria-label="Close panel"><svg class="w-5 h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div> <div class="flex-1 overflow-y-auto p-4">`);
    {
      $$renderer2.push("<!--[-->");
      if (selectedMatchesList.length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="text-center py-12 text-charcoal-300 text-sm"><p>No matches selected yet</p> <p class="text-xs text-charcoal-400 mt-2">Click matches in the timeline or list to add them to your coverage plan</p></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="space-y-4">`);
        if (conflictGroups.length > 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="border border-warning-500/50 rounded-lg bg-warning-500/10 p-4"><div class="flex items-center justify-between mb-3"><div><h4 class="text-sm font-semibold text-warning-500">⚠️ Conflicts Detected</h4> <p class="text-xs text-charcoal-300 mt-0.5">${escape_html(conflictGroups.length)} conflict group${escape_html(conflictGroups.length !== 1 ? "s" : "")} in your plan `);
          if (conflictGroups.length > 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<span class="ml-2 text-gold-500">• Conflict ${escape_html(currentConflictIndex + 1)} of ${escape_html(conflictGroups.length)}</span>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></p></div> <div class="flex items-center gap-2">`);
          if (conflictGroups.length > 1) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<button class="px-2 py-1 text-xs font-medium rounded-lg bg-charcoal-700 text-charcoal-200 hover:bg-charcoal-600 transition-colors border border-charcoal-600" title="Previous conflict">← Prev</button> <button class="px-2 py-1 text-xs font-medium rounded-lg bg-charcoal-700 text-charcoal-200 hover:bg-charcoal-600 transition-colors border border-charcoal-600" title="Next conflict">Next →</button>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> <button class="px-3 py-1.5 text-xs font-medium rounded-lg bg-warning-500/20 text-warning-500 border border-warning-500/50 hover:bg-warning-500/30 transition-colors">Auto-Resolve</button></div></div> <div class="space-y-3"><!--[-->`);
          const each_array = ensure_array_like(conflictGroups);
          for (let groupIndex = 0, $$length = each_array.length; groupIndex < $$length; groupIndex++) {
            let group = each_array[groupIndex];
            $$renderer2.push(`<div${attr_class(`border rounded p-3 transition-all ${stringify(groupIndex === currentConflictIndex ? "border-gold-500 bg-gold-500/5" : "border-warning-500/30 bg-charcoal-800/50")}`)}><div class="flex items-center gap-2 mb-2"><div class="text-xs font-medium text-warning-500">Conflict Group ${escape_html(groupIndex + 1)}: ${escape_html(group.conflictCount)} overlapping match${escape_html(group.conflictCount !== 1 ? "es" : "")}</div> `);
            if (groupIndex === currentConflictIndex) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="text-[10px] font-semibold text-gold-500 px-1.5 py-0.5 rounded bg-gold-500/20">ACTIVE</div>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></div> <div class="space-y-2"><!--[-->`);
            const each_array_1 = ensure_array_like(group.matches);
            for (let matchIndex = 0, $$length2 = each_array_1.length; matchIndex < $$length2; matchIndex++) {
              let match = each_array_1[matchIndex];
              const teamId = getTeamIdentifier(match);
              const conflictMatches = getMatchConflicts(match.MatchId);
              const isFirstMatch = matchIndex === 0;
              $$renderer2.push(`<div${attr_class(`flex items-center gap-2 px-2 py-1.5 rounded ${stringify(isFirstMatch ? "bg-gold-500/10 border border-gold-500/30" : "bg-charcoal-700/50")}`)}>`);
              if (isFirstMatch) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="flex-shrink-0 text-[10px] font-semibold text-gold-500 px-1.5 py-0.5 rounded bg-gold-500/20">KEEP</div>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--> <div class="flex-1 min-w-0"><div class="flex items-center gap-2"><span class="text-xs font-semibold text-charcoal-50">${escape_html(formatMatchTime(match.ScheduledStartDateTime))}</span> <span class="text-xs text-[#facc15] font-medium">${escape_html(match.CourtName)}</span> <span class="text-xs text-charcoal-200">${escape_html(teamId || match.Division.CodeAlias)}</span></div> `);
              if (conflictMatches.length > 0) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="text-[10px] text-charcoal-400 mt-0.5">Conflicts with ${escape_html(conflictMatches.length)} other match${escape_html(conflictMatches.length !== 1 ? "es" : "")}</div>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--></div> `);
              if (!isFirstMatch) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<button class="px-2 py-1 text-[10px] font-medium rounded bg-warning-500/20 text-warning-500 border border-warning-500/50 hover:bg-warning-500/30 transition-colors">Remove</button>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--></div>`);
            }
            $$renderer2.push(`<!--]--></div></div>`);
          }
          $$renderer2.push(`<!--]--></div></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (coverageAwareOpportunities.length > 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="border border-green-500/50 rounded-lg bg-green-950/10 p-4"><div class="flex items-center justify-between mb-3"><div><h4 class="text-sm font-semibold text-green-400">💡 Coverage Opportunities</h4> <p class="text-xs text-charcoal-300 mt-0.5">${escape_html(coverageAwareOpportunities.length)} suggestion${escape_html(coverageAwareOpportunities.length !== 1 ? "s" : "")} (prioritizing uncovered teams)</p></div></div> <div class="space-y-2"><!--[-->`);
          const each_array_2 = ensure_array_like(coverageAwareOpportunities);
          for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
            let suggestion = each_array_2[$$index_2];
            const match = suggestion.match;
            const teamId = getTeamIdentifier(match);
            const teamStatus = teamId ? coverageStatus.getTeamStatus(teamId) : "not-covered";
            $$renderer2.push(`<div class="flex items-center gap-2 px-2 py-1.5 rounded bg-green-950/20 border border-green-500/30"><div class="flex-1 min-w-0"><div class="flex items-center gap-2"><span class="text-xs font-semibold text-charcoal-50">${escape_html(formatMatchTime(match.ScheduledStartDateTime))}</span> <span class="text-xs text-green-400 font-medium">${escape_html(match.CourtName)}</span> <span class="text-xs text-charcoal-200">${escape_html(teamId || match.Division.CodeAlias)}</span> `);
            if (teamStatus === "not-covered") {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<span class="text-[10px] px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-500 border border-gold-500/50">Uncovered</span>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></div> <div class="text-[10px] text-charcoal-400 mt-0.5">${escape_html(suggestion.reason)}</div></div> <button class="px-2 py-1 text-xs font-medium rounded transition-colors bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30">Add</button></div>`);
          }
          $$renderer2.push(`<!--]--></div></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <div class="space-y-4"><!--[-->`);
        const each_array_3 = ensure_array_like(sortedDates);
        for (let $$index_4 = 0, $$length = each_array_3.length; $$index_4 < $$length; $$index_4++) {
          let dateKey = each_array_3[$$index_4];
          const dateMatches = matchesByDate[dateKey];
          $$renderer2.push(`<div class="space-y-2"><div class="flex items-center gap-2 pb-2 border-b border-charcoal-700"><h4 class="text-sm font-semibold text-charcoal-50">${escape_html(dateKey)}</h4> <span class="text-xs text-charcoal-400">(${escape_html(dateMatches.length)} match${escape_html(dateMatches.length !== 1 ? "es" : "")})</span></div> <!--[-->`);
          const each_array_4 = ensure_array_like(dateMatches);
          for (let $$index_3 = 0, $$length2 = each_array_4.length; $$index_3 < $$length2; $$index_3++) {
            let match = each_array_4[$$index_3];
            const teamId = getTeamIdentifier(match);
            const opponent = getOpponent(match);
            const hasConflict = planConflicts.has(match.MatchId);
            $$renderer2.push(`<div${attr_class(`flex items-center gap-3 px-3 py-2.5 rounded border ${stringify(hasConflict ? "border-warning-500/50 bg-warning-500/10" : "border-gold-500/50 bg-gold-500/5")}`)}><button${attr_class(`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center hover:opacity-80 transition-colors ${stringify(hasConflict ? "border-warning-500/50 bg-warning-500/20" : "border-gold-500 bg-gold-500/20")}`)} aria-label="Remove from plan"><svg${attr_class(`w-3 h-3 ${stringify(hasConflict ? "text-warning-500" : "text-[#facc15]")}`)} fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></button> `);
            if (hasConflict) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="flex-shrink-0 text-[10px] font-semibold text-warning-500 px-1.5 py-0.5 rounded bg-warning-500/20">CONFLICT</div>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> <div class="flex-shrink-0 w-20 text-sm font-semibold text-charcoal-50">${escape_html(formatMatchTime(match.ScheduledStartDateTime))}</div> <div class="flex-shrink-0 w-24 text-sm font-bold text-[#facc15]">${escape_html(match.CourtName)}</div> <div class="flex-1 min-w-0"><div class="flex items-center gap-2"><div class="text-sm font-bold text-charcoal-50">${escape_html(teamId || match.Division.CodeAlias)}</div> `);
            if (teamId) {
              $$renderer2.push("<!--[-->");
              const teamStatus = coverageStatus.getTeamStatus(teamId);
              $$renderer2.push(`<div${attr_class(`w-2 h-2 rounded ${stringify(teamStatus === "covered" ? "bg-green-500" : teamStatus === "partially-covered" ? "bg-[#f59e0b]" : teamStatus === "planned" ? "bg-gold-500" : "bg-[#808593]")}`)}${attr("title", `Status: ${stringify(teamStatus)}`)}></div>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></div> <div class="text-xs text-charcoal-200 truncate">vs ${escape_html(opponent)}</div></div> `);
            if (teamId) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="relative flex-shrink-0"><button${attr_class(`px-2 py-1 text-xs rounded transition-colors ${stringify(coverageStatusMenuOpen === teamId ? "bg-gold-500 text-charcoal-950" : "bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-600 border border-charcoal-600")}`)} title="Set coverage status">${escape_html((() => {
                const status = coverageStatus.getTeamStatus(teamId);
                if (status === "covered") return "✓";
                if (status === "partially-covered") return "◐";
                if (status === "planned") return "📋";
                return "○";
              })())}</button> `);
              if (coverageStatusMenuOpen === teamId) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="fixed inset-0 z-40" role="button" tabindex="0"></div> <div class="absolute right-0 top-full mt-1 z-50">`);
                CoverageStatusSelector($$renderer2, {
                  teamId,
                  currentStatus: coverageStatus.getTeamStatus(teamId),
                  onStatusChange: (status) => {
                    coverageStatus.setTeamStatus(teamId, status);
                    coverageStatusMenuOpen = null;
                  },
                  onClose: () => coverageStatusMenuOpen = null
                });
                $$renderer2.push(`<!----></div>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--></div>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> <div class="flex-shrink-0"><span class="px-2 py-0.5 text-[10px] font-semibold rounded"${attr_style(`background-color: ${stringify(match.Division.ColorHex)}20; color: ${stringify(match.Division.ColorHex)}; border: 1px solid ${stringify(match.Division.ColorHex)}40;`)}>${escape_html(match.Division.CodeAlias)}</span></div></div>`);
          }
          $$renderer2.push(`<!--]--></div>`);
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (selectedMatchesList.length > 0 && activeTab === "plan") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-t border-charcoal-700 bg-charcoal-700/50"><div class="flex items-center gap-2 flex-wrap"><button class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-600 border border-charcoal-600">Mark All as Planned</button> <button class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-600 border border-charcoal-600">Mark All as Covered</button> <button class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-700">Clear Plan</button></div> <div class="flex items-center gap-2 flex-wrap"><button class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-600 border border-charcoal-600" title="Copy plan to clipboard">Copy</button> <div class="flex items-center gap-1 bg-charcoal-800 rounded-lg p-1 border border-charcoal-700"><button class="px-2 py-1 text-xs font-medium rounded transition-colors text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-700" title="Export as JSON">JSON</button> <button class="px-2 py-1 text-xs font-medium rounded transition-colors text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-700" title="Export as CSV">CSV</button> <button class="px-2 py-1 text-xs font-medium rounded transition-colors text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-700" title="Export as Text">TXT</button> <button class="px-2 py-1 text-xs font-medium rounded transition-colors text-charcoal-200 hover:text-charcoal-50 hover:bg-charcoal-700" title="Export as Calendar (ICS)">📅 ICS</button></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div>`);
    bind_props($$props, { matches, onClose });
  });
}
function CoachView($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let teams, matchesByTeam, sortedTeams;
    let matches = $$props["matches"];
    let eventId = $$props["eventId"];
    let clubId = $$props["clubId"];
    let selectedTeam = null;
    teams = getUniqueTeams(matches);
    matchesByTeam = (() => {
      const grouped = {};
      matches.forEach((match) => {
        const teamId = getTeamIdentifier(match);
        if (teamId) {
          if (!grouped[teamId]) {
            grouped[teamId] = [];
          }
          grouped[teamId].push(match);
        }
      });
      return grouped;
    })();
    sortedTeams = (() => {
      return [...teams].sort((a, b) => {
        const matchesA = matchesByTeam[a]?.length || 0;
        const matchesB = matchesByTeam[b]?.length || 0;
        return matchesB - matchesA;
      });
    })();
    $$renderer2.push(`<div class="space-y-4"><div class="flex items-center justify-between flex-wrap gap-4"><div><h1 class="text-xl font-bold text-charcoal-50">Coach View</h1> <p class="text-sm text-charcoal-300 mt-1">View matches and work assignments by team</p></div> <div class="flex items-center gap-2 bg-charcoal-700 rounded-lg p-1"><button${attr_class(`px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] ${stringify(
      "bg-gold-500 text-charcoal-950"
    )}`)}>Matches</button> <button${attr_class(`px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] ${stringify("text-charcoal-200 hover:text-charcoal-50")}`)}>Work Assignments</button></div></div> `);
    if (teams.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="border-b border-charcoal-700 pb-4"><div class="flex items-center gap-2 flex-wrap"><span class="text-xs text-charcoal-300 uppercase tracking-wider">Select Team:</span> <!--[-->`);
      const each_array = ensure_array_like(sortedTeams);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let teamId = each_array[$$index];
        $$renderer2.push(`<button${attr_class(`px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] ${stringify(selectedTeam === teamId ? "bg-gold-500 text-charcoal-950" : "bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 border border-charcoal-600")}`)}>${escape_html(teamId)} `);
        if (matchesByTeam[teamId]) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="ml-2 text-[10px] opacity-75">(${escape_html(matchesByTeam[teamId].length)})</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></button>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="text-center py-12 text-charcoal-300 text-sm">Select a team to view matches and work assignments</div>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { matches, eventId, clubId });
  });
}
function Sidebar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let divisions, teams, conflictCount, activeFilterCount;
    let matches = $$props["matches"];
    let collapsed = fallback($$props["collapsed"], false);
    let onToggle = $$props["onToggle"];
    divisions = getUniqueDivisions(matches);
    teams = getUniqueTeams(matches);
    conflictCount = (() => {
      const conflicts = /* @__PURE__ */ new Map();
      matches.forEach((match1, i) => {
        matches.slice(i + 1).forEach((match2) => {
          const overlaps = match1.ScheduledStartDateTime < match2.ScheduledEndDateTime && match1.ScheduledEndDateTime > match2.ScheduledStartDateTime;
          if (overlaps) {
            if (!conflicts.has(match1.MatchId)) conflicts.set(match1.MatchId, []);
            conflicts.get(match1.MatchId).push(match2.MatchId);
          }
        });
      });
      return matches.filter((m) => conflicts.has(m.MatchId)).length;
    })();
    activeFilterCount = (() => {
      let count = 0;
      if (store_get($$store_subs ??= {}, "$filters", filters).wave !== "all") count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).division) count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).teams.length > 0) count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).priority && store_get($$store_subs ??= {}, "$filters", filters).priority !== "all") count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).coverageStatus && store_get($$store_subs ??= {}, "$filters", filters).coverageStatus !== "all") count++;
      return count;
    })();
    $$renderer2.push(`<aside${attr_class("hidden lg:flex flex-col h-[calc(100vh-64px)] border-r transition-all duration-300 overflow-hidden bg-surface-100 border-charcoal-900", void 0, { "w-64": !collapsed, "w-16": collapsed })} style="max-width: 250px;"><div class="flex items-center justify-between p-4 border-b border-charcoal-900">`);
    if (!collapsed) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<h2 class="text-sm font-semibold text-charcoal-50">Filters</h2>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="w-6 h-6 flex items-center justify-center"><span class="text-lg" role="img" aria-label="Filters">🎯</span></div>`);
    }
    $$renderer2.push(`<!--]--> <button class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-charcoal-300 bg-surface-200"${attr("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar")}${attr("title", collapsed ? "Expand sidebar" : "Collapse sidebar")}>`);
    if (collapsed) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`→`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`←`);
    }
    $$renderer2.push(`<!--]--></button></div> `);
    if (!collapsed) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex-1 overflow-y-auto p-4 space-y-3"><div class="pb-3 border-b border-charcoal-900"><label for="wave-filter-sidebar" class="block text-xs font-medium mb-2 text-left text-charcoal-300">Session Time <span class="block text-[10px] font-normal text-charcoal-400 mt-0.5">Filter by morning or afternoon matches</span></label> <div class="flex gap-2"><button${attr_class(`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${stringify(store_get($$store_subs ??= {}, "$filters", filters).wave === "all" ? "bg-gold-500 text-charcoal-950" : "bg-surface-200 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-900")}`)} aria-label="Show all matches">All</button> <button${attr_class(`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${stringify(store_get($$store_subs ??= {}, "$filters", filters).wave === "morning" ? "bg-gold-500 text-charcoal-950" : "bg-surface-200 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-900")}`)} aria-label="Show morning matches only">AM</button> <button${attr_class(`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${stringify(store_get($$store_subs ??= {}, "$filters", filters).wave === "afternoon" ? "bg-gold-500 text-charcoal-950" : "bg-surface-200 text-charcoal-300 hover:text-charcoal-50 border border-charcoal-900")}`)} aria-label="Show afternoon matches only">PM</button></div></div> <div class="pb-3 border-b border-charcoal-900"><label for="sidebar-division" class="block text-xs font-medium mb-2 text-left text-charcoal-300">Division</label> `);
      $$renderer2.select(
        {
          id: "sidebar-division",
          value: store_get($$store_subs ??= {}, "$filters", filters).division || "",
          onchange: (e) => updateFilter("division", e.target.value || null),
          class: "w-full px-3 py-2 rounded-lg text-sm focus:border-gold-500 focus:outline-none text-left bg-surface-200 text-charcoal-50 border border-charcoal-900",
          "aria-label": "Filter matches by division"
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "" }, ($$renderer4) => {
            $$renderer4.push(`All Divisions`);
          });
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(divisions);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let division = each_array[$$index];
            $$renderer3.option({ value: division }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(division)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
      $$renderer2.push(`</div> <div class="pb-3 border-b border-charcoal-900"><label for="sidebar-team" class="block text-xs font-medium mb-2 text-left text-charcoal-300">Team</label> `);
      $$renderer2.select(
        {
          id: "sidebar-team",
          value: store_get($$store_subs ??= {}, "$filters", filters).teams[0] || "",
          onchange: (e) => updateFilter("teams", e.target.value ? [e.target.value] : []),
          class: "w-full px-3 py-2 rounded-lg text-sm focus:border-gold-500 focus:outline-none text-left bg-surface-200 text-charcoal-50 border border-charcoal-900",
          "aria-label": "Filter matches by team"
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "" }, ($$renderer4) => {
            $$renderer4.push(`All Teams`);
          });
          $$renderer3.push(`<!--[-->`);
          const each_array_1 = ensure_array_like(teams);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let team = each_array_1[$$index_1];
            $$renderer3.option({ value: team }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(team)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
      $$renderer2.push(`</div> `);
      if (activeFilterCount > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button class="w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors" style="background-color: #252529; color: #a1a1a6; border: 1px solid #2a2a2f;">Clear Filters (${escape_html(activeFilterCount)})</button>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="flex-1 overflow-y-auto p-2 space-y-2"><button class="w-12 h-12 flex items-center justify-center rounded-lg transition-colors" style="background-color: #252529; color: #a1a1a6;" title="Toggle Wave">🌊</button> `);
      if (activeFilterCount > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="w-12 h-12 flex items-center justify-center rounded-lg" style="background-color: #252529;"><span class="text-xs font-medium" style="color: #eab308;">${escape_html(activeFilterCount)}</span></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> <div class="p-4 border-t" style="border-color: #2a2a2f;">`);
    if (!collapsed) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<h3 class="text-xs font-semibold mb-3" style="color: #a1a1a6;">Quick Stats</h3> <div class="space-y-3"><div class="p-3 rounded-lg border" style="background-color: #252529; border-color: #2a2a2f;"><div class="text-xs mb-1" style="color: #6e6e73;">Total Matches</div> <div class="text-xl font-bold" style="color: #f5f5f7;">${escape_html(matches.length)}</div></div> `);
      if (conflictCount > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="p-3 rounded-lg border" style="background-color: #252529; border-color: #2a2a2f;"><div class="text-xs mb-1" style="color: #6e6e73;">Conflicts</div> <div class="text-xl font-bold text-warning-500">${escape_html(conflictCount)}</div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="space-y-2"><div class="w-12 h-12 flex flex-col items-center justify-center rounded-lg" style="background-color: #252529;"><span class="text-xs font-medium" style="color: #f5f5f7;">${escape_html(matches.length)}</span> <span class="text-xs" style="color: #6e6e73;">📊</span></div> `);
      if (conflictCount > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="w-12 h-12 flex flex-col items-center justify-center rounded-lg" style="background-color: #252529;"><span class="text-xs font-medium text-warning-500">${escape_html(conflictCount)}</span> <span class="text-xs" style="color: #6e6e73;">⚠️</span></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div></aside>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { matches, collapsed, onToggle });
  });
}
function MobileHeader($$renderer, $$props) {
  let eventName = fallback($$props["eventName"], null);
  let matchCount = fallback($$props["matchCount"], 0);
  let conflictCount = fallback($$props["conflictCount"], 0);
  let collapsed = fallback($$props["collapsed"], true);
  let onToggle = $$props["onToggle"];
  $$renderer.push(`<header${attr_class("sticky top-0 z-40 border-b border-charcoal-700 bg-charcoal-950 transition-all duration-300 svelte-54pqel", void 0, {
    "collapsed": (
      // Scroll handling is now managed by parent component
      collapsed
    )
  })} style="backdrop-filter: blur(10px); background-color: rgba(24, 24, 27, 0.95);"><div class="px-4 py-3"><div${attr_class("flex items-center justify-between gap-2", void 0, { "hidden": !collapsed })}><div class="flex items-center gap-2 min-w-0 flex-1"><h1 class="text-base font-semibold truncate text-charcoal-50">630 Volleyball</h1> `);
  if (matchCount > 0) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<span class="text-xs whitespace-nowrap text-charcoal-300">${escape_html(matchCount)} `);
    if (conflictCount > 0) {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<span class="ml-1 text-warning-500">• ${escape_html(conflictCount)}</span>`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]--></span>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></div> <button type="button" class="w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-charcoal-300 bg-charcoal-900 hover:bg-charcoal-800 min-h-[44px]"${attr("aria-label", collapsed ? "Expand header" : "Collapse header")}><span class="text-lg">${escape_html(collapsed ? "▼" : "▲")}</span></button></div> <div${attr_class("flex flex-col gap-2", void 0, { "hidden": collapsed })}><div class="flex items-center justify-between gap-2"><div class="flex items-center gap-2 min-w-0 flex-1"><h1 class="text-base font-semibold truncate text-charcoal-50">630 Volleyball Coverage</h1> `);
  if (matchCount > 0) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<span class="text-xs whitespace-nowrap text-charcoal-300">${escape_html(matchCount)} matches `);
    if (conflictCount > 0) {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<span class="ml-2 text-warning-500">• ${escape_html(conflictCount)} conflicts</span>`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]--></span>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></div> <button type="button" class="w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-charcoal-300 bg-charcoal-900 hover:bg-charcoal-800 min-h-[44px]" aria-label="Collapse header"><span class="text-lg">▲</span></button></div> `);
  if (eventName) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<div class="text-xs text-charcoal-300 truncate">${escape_html(eventName)}</div>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></div></div></header>`);
  bind_props($$props, { eventName, matchCount, conflictCount, collapsed, onToggle });
}
function MobileBottomNav($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let isMediaValue, isCoachValue, selectedCountValue, tabs;
    let activeTab = fallback($$props["activeTab"], "matches");
    let onTabChange = $$props["onTabChange"];
    let activeFilterCount = 0;
    function getActiveFilterCount() {
      let count = 0;
      if (store_get($$store_subs ??= {}, "$filters", filters).wave !== "all") count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).division) count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).teams.length > 0) count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).timeRange.start || store_get($$store_subs ??= {}, "$filters", filters).timeRange.end) count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).priority && store_get($$store_subs ??= {}, "$filters", filters).priority !== "all") count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).coverageStatus && store_get($$store_subs ??= {}, "$filters", filters).coverageStatus !== "all") count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).conflictsOnly) count++;
      if (store_get($$store_subs ??= {}, "$filters", filters).myTeamsOnly) count++;
      return count;
    }
    activeFilterCount = getActiveFilterCount();
    isMediaValue = store_get($$store_subs ??= {}, "$isMedia", isMedia);
    isCoachValue = store_get($$store_subs ??= {}, "$isCoach", isCoach);
    selectedCountValue = store_get($$store_subs ??= {}, "$selectedCount", selectedCount);
    tabs = isMediaValue ? [
      { id: "matches", label: "Matches", icon: "📋" },
      {
        id: "plan",
        label: "Schedule",
        icon: "📝",
        badge: selectedCountValue > 0 ? selectedCountValue : void 0
      },
      {
        id: "filters",
        label: "Filters",
        icon: "🔍",
        badge: activeFilterCount > 0 ? activeFilterCount : void 0
      },
      { id: "more", label: "More", icon: "⚙️" }
    ] : isCoachValue ? [
      { id: "matches", label: "Schedule", icon: "📅" },
      { id: "more", label: "More", icon: "⚙️" }
    ] : [
      { id: "matches", label: "Matches", icon: "📋" },
      {
        id: "filters",
        label: "Filters",
        icon: "🔍",
        badge: activeFilterCount > 0 ? activeFilterCount : void 0
      },
      { id: "more", label: "More", icon: "⚙️" }
    ];
    $$renderer2.push(`<nav class="fixed bottom-0 left-0 right-0 z-50 bg-charcoal-900 border-t border-charcoal-700 svelte-2rf3uy" style="padding-bottom: env(safe-area-inset-bottom);" aria-label="Main navigation"><div class="flex items-center justify-around h-16" role="tablist"><!--[-->`);
    const each_array = ensure_array_like(tabs);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let tab = each_array[$$index];
      $$renderer2.push(`<button type="button" role="tab"${attr("aria-selected", activeTab === tab.id)}${attr("aria-label", tab.label)}${attr_class("flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors svelte-2rf3uy", void 0, {
        "text-gold-500": activeTab === tab.id,
        "text-charcoal-400": activeTab !== tab.id
      })}>`);
      if (activeTab === tab.id) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gold-500 rounded-b-full"></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="flex items-center justify-center relative"><span class="text-xl">${escape_html(tab.icon)}</span> `);
      if (tab.badge && tab.badge > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-gold-500 text-charcoal-950 text-[10px] font-bold rounded-full">${escape_html(tab.badge > 99 ? "99+" : tab.badge)}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <span class="text-[10px] font-medium mt-0.5">${escape_html(tab.label)}</span></button>`);
    }
    $$renderer2.push(`<!--]--></div></nav>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { activeTab, onTabChange });
  });
}
function MobileFilterBar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let activeFilters, isMediaValue;
    let onOpenFullFilters = $$props["onOpenFullFilters"];
    function getActiveFilters() {
      const active = [];
      if (store_get($$store_subs ??= {}, "$filters", filters).wave !== "all") {
        active.push({
          key: "wave",
          label: "Wave",
          value: store_get($$store_subs ??= {}, "$filters", filters).wave === "morning" ? "Morning" : "Afternoon"
        });
      }
      if (store_get($$store_subs ??= {}, "$filters", filters).division) {
        active.push({
          key: "division",
          label: "Division",
          value: store_get($$store_subs ??= {}, "$filters", filters).division
        });
      }
      if (store_get($$store_subs ??= {}, "$filters", filters).teams.length > 0) {
        store_get($$store_subs ??= {}, "$filters", filters).teams.forEach((team) => {
          active.push({ key: "team", label: "Team", value: team });
        });
      }
      if (store_get($$store_subs ??= {}, "$filters", filters).priority && store_get($$store_subs ??= {}, "$filters", filters).priority !== "all") {
        active.push({
          key: "priority",
          label: "Priority",
          value: store_get($$store_subs ??= {}, "$filters", filters).priority === "must-cover" ? "Must Cover" : store_get($$store_subs ??= {}, "$filters", filters).priority === "priority" ? "Priority" : "Optional"
        });
      }
      if (store_get($$store_subs ??= {}, "$filters", filters).coverageStatus && store_get($$store_subs ??= {}, "$filters", filters).coverageStatus !== "all") {
        active.push({
          key: "coverageStatus",
          label: "Status",
          value: store_get($$store_subs ??= {}, "$filters", filters).coverageStatus === "uncovered" ? "Uncovered" : store_get($$store_subs ??= {}, "$filters", filters).coverageStatus === "planned" ? "Planned" : "Covered"
        });
      }
      if (store_get($$store_subs ??= {}, "$filters", filters).conflictsOnly) {
        active.push({ key: "conflictsOnly", label: "Conflicts", value: "Only" });
      }
      return active;
    }
    activeFilters = getActiveFilters();
    isMediaValue = store_get($$store_subs ??= {}, "$userRole", userRole) === "media";
    $$renderer2.push(`<div class="sticky top-0 z-30 bg-charcoal-950 border-b border-charcoal-700 py-2 px-3"><div class="flex items-center gap-2 overflow-x-auto scrollbar-hide svelte-szaik9"><div class="flex items-center gap-2 flex-shrink-0"><button type="button"${attr_class("px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center", void 0, {
      "bg-gold-500": store_get($$store_subs ??= {}, "$filters", filters).wave === "morning",
      "text-charcoal-950": store_get($$store_subs ??= {}, "$filters", filters).wave === "morning",
      "bg-charcoal-800": store_get($$store_subs ??= {}, "$filters", filters).wave !== "morning",
      "text-charcoal-300": store_get($$store_subs ??= {}, "$filters", filters).wave !== "morning",
      "hover:bg-charcoal-700": store_get($$store_subs ??= {}, "$filters", filters).wave !== "morning"
    })}>AM</button> <button type="button"${attr_class("px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center", void 0, {
      "bg-gold-500": store_get($$store_subs ??= {}, "$filters", filters).wave === "afternoon",
      "text-charcoal-950": store_get($$store_subs ??= {}, "$filters", filters).wave === "afternoon",
      "bg-charcoal-800": store_get($$store_subs ??= {}, "$filters", filters).wave !== "afternoon",
      "text-charcoal-300": store_get($$store_subs ??= {}, "$filters", filters).wave !== "afternoon",
      "hover:bg-charcoal-700": store_get($$store_subs ??= {}, "$filters", filters).wave !== "afternoon"
    })}>PM</button> `);
    if (isMediaValue) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button type="button"${attr_class("px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center gap-1", void 0, {
        "bg-gold-500": store_get($$store_subs ??= {}, "$filters", filters).priority === "must-cover",
        "text-charcoal-950": store_get($$store_subs ??= {}, "$filters", filters).priority === "must-cover",
        "bg-charcoal-800": store_get($$store_subs ??= {}, "$filters", filters).priority !== "must-cover",
        "text-charcoal-300": store_get($$store_subs ??= {}, "$filters", filters).priority !== "must-cover",
        "hover:bg-charcoal-700": store_get($$store_subs ??= {}, "$filters", filters).priority !== "must-cover"
      })}>⭐ Must Cover</button> <button type="button"${attr_class("px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center gap-1", void 0, {
        "bg-warning-500": store_get($$store_subs ??= {}, "$filters", filters).conflictsOnly,
        "text-charcoal-950": store_get($$store_subs ??= {}, "$filters", filters).conflictsOnly,
        "bg-charcoal-800": !store_get($$store_subs ??= {}, "$filters", filters).conflictsOnly,
        "text-charcoal-300": !store_get($$store_subs ??= {}, "$filters", filters).conflictsOnly,
        "hover:bg-charcoal-700": !store_get($$store_subs ??= {}, "$filters", filters).conflictsOnly
      })}>⚠️ Conflicts</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (activeFilters.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex items-center gap-2 flex-shrink-0"><!--[-->`);
      const each_array = ensure_array_like(activeFilters);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let filter = each_array[$$index];
        $$renderer2.push(`<button type="button" class="group px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center gap-1.5 bg-gold-500/20 text-gold-400 border border-gold-500/50 hover:bg-gold-500/30"><span>${escape_html(filter.label)}: ${escape_html(filter.value)}</span> <span class="text-gold-500 group-hover:text-gold-300">×</span></button>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button type="button" class="ml-auto px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center gap-1.5 flex-shrink-0 bg-charcoal-800 text-charcoal-300 border border-charcoal-700 hover:bg-charcoal-700 hover:text-charcoal-200">🔍 More</button></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { onOpenFullFilters });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let divisions, teams, conflictCount, selectedCountValue, isMediaValue, isCoachValue, userRoleValue;
    let eventId = "PTAwMDAwNDEzMTQ90";
    let matches = [];
    let viewMode = "list";
    let showConfig = false;
    let clubId = 24426;
    let showCoveragePlan = false;
    let headerCollapsed = true;
    let sidebarCollapsed = false;
    let activeTab = "matches";
    let showFilterSheet = false;
    let showMoreMenu = false;
    function handleTabChange(tab) {
      if (activeTab === tab) {
        if (tab === "filters") {
          showFilterSheet = false;
        } else if (tab === "plan") {
          showCoveragePlan = false;
        } else if (tab === "more") {
          showMoreMenu = false;
        }
        activeTab = "matches";
      } else {
        activeTab = tab;
        if (tab === "filters") {
          showFilterSheet = true;
          showCoveragePlan = false;
          showMoreMenu = false;
        } else if (tab === "plan") {
          showCoveragePlan = true;
          showFilterSheet = false;
          showMoreMenu = false;
        } else if (tab === "more") {
          showMoreMenu = true;
          showFilterSheet = false;
          showCoveragePlan = false;
        } else {
          showFilterSheet = false;
          showMoreMenu = false;
          showCoveragePlan = false;
        }
      }
    }
    function closeFilterSheet() {
      showFilterSheet = false;
      activeTab = "matches";
    }
    function closeCoveragePlan() {
      showCoveragePlan = false;
      activeTab = "matches";
    }
    divisions = getUniqueDivisions(matches);
    teams = getUniqueTeams(matches);
    if (matches.length > 0) {
      const teamMatches = /* @__PURE__ */ new Map();
      matches.forEach((match) => {
        const teamText = match.InvolvedTeam === "first" ? match.FirstTeamText : match.SecondTeamText;
        const matchResult = teamText.match(/(\d+-\d+)/);
        const teamId = matchResult ? matchResult[1] : "";
        if (!teamId) return;
        const stats = teamMatches.get(teamId) || { total: 0, inPlan: 0 };
        stats.total++;
        let isSelected = false;
        coveragePlan.subscribe((plan) => {
          isSelected = plan.has(match.MatchId);
        })();
        if (isSelected) {
          stats.inPlan++;
        }
        teamMatches.set(teamId, stats);
      });
      teamMatches.forEach((stats, teamId) => {
        coverageStatus.updateFromPlan(teamId, stats.inPlan, stats.total);
      });
    }
    conflictCount = (() => {
      const conflicts = /* @__PURE__ */ new Map();
      matches.forEach((match1, i) => {
        matches.slice(i + 1).forEach((match2) => {
          const overlaps = match1.ScheduledStartDateTime < match2.ScheduledEndDateTime && match1.ScheduledEndDateTime > match2.ScheduledStartDateTime;
          if (overlaps) {
            if (!conflicts.has(match1.MatchId)) conflicts.set(match1.MatchId, []);
            conflicts.get(match1.MatchId).push(match2.MatchId);
          }
        });
      });
      return matches.filter((m) => conflicts.has(m.MatchId)).length;
    })();
    selectedCountValue = store_get($$store_subs ??= {}, "$selectedCount", selectedCount);
    isMediaValue = store_get($$store_subs ??= {}, "$isMedia", isMedia);
    store_get($$store_subs ??= {}, "$isSpectator", isSpectator);
    isCoachValue = store_get($$store_subs ??= {}, "$isCoach", isCoach);
    userRoleValue = store_get($$store_subs ??= {}, "$userRole", userRole);
    if (matches.length > 0 && selectedCountValue !== void 0) {
      const teamMatches = /* @__PURE__ */ new Map();
      const currentPlan = get(coveragePlan);
      matches.forEach((match) => {
        const teamText = match.InvolvedTeam === "first" ? match.FirstTeamText : match.SecondTeamText;
        const matchResult = teamText.match(/(\d+-\d+)/);
        const teamId = matchResult ? matchResult[1] : "";
        if (!teamId) return;
        const stats = teamMatches.get(teamId) || { total: 0, inPlan: 0 };
        stats.total++;
        if (currentPlan.has(match.MatchId)) {
          stats.inPlan++;
        }
        teamMatches.set(teamId, stats);
      });
      teamMatches.forEach((stats, teamId) => {
        coverageStatus.updateFromPlan(teamId, stats.inPlan, stats.total);
      });
    }
    $$renderer2.push(`<div class="min-h-screen bg-charcoal-950 pb-20">`);
    MobileHeader($$renderer2, {
      eventName: null,
      matchCount: matches.length,
      conflictCount,
      collapsed: headerCollapsed,
      onToggle: () => headerCollapsed = !headerCollapsed
    });
    $$renderer2.push(`<!----> <header data-header=""${attr_class("hidden md:block border-b sticky top-0 z-10 transition-all duration-300 border-charcoal-700 glass-medium", void 0, {
      "collapsed": headerCollapsed,
      "glassmorphism": !headerCollapsed
    })}><style>
			/* Mobile: Lighter glassmorphism */
			@media (max-width: 639px) {
				header.glassmorphism {
					backdrop-filter: blur(10px);
					background-color: rgba(37, 37, 41, 0.85);
					border-bottom-color: rgba(58, 58, 63, 0.4);
				}
			}
			/* Desktop: Stronger glassmorphism */
			@media (min-width: 640px) {
				header.glassmorphism {
					backdrop-filter: blur(20px);
					background-color: rgba(37, 37, 41, 0.8);
					border-bottom-color: rgba(58, 58, 63, 0.5);
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
				}
			}
		</style> <div class="container mx-auto px-3 sm:px-4 py-2 sm:py-3"><div class="flex items-center justify-between gap-2 sm:hidden"><div class="flex items-center gap-2 min-w-0 flex-1"><h1 class="text-base font-semibold truncate text-charcoal-50">630 Volleyball</h1> `);
    if (matches.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="text-xs whitespace-nowrap text-charcoal-300">${escape_html(matches.length)} `);
      if (conflictCount > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="ml-1 text-warning-500">• ${escape_html(conflictCount)}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <button class="w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-charcoal-300 bg-charcoal-900"${attr("aria-label", headerCollapsed ? "Expand header" : "Collapse header")}>${escape_html(headerCollapsed ? "▼" : "▲")}</button></div> <div${attr_class("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4", void 0, { "hidden": headerCollapsed })}><div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 sm:gap-4 min-w-0 flex-1"><div class="flex flex-col gap-1 min-w-0"><div class="text-[10px] sm:text-xs text-charcoal-400 uppercase tracking-wider">Event Schedule</div> <div class="flex items-center gap-2 min-w-0">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<h1 class="text-base sm:text-lg font-semibold truncate text-charcoal-50">630 Volleyball</h1>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (matches.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="text-xs whitespace-nowrap hidden sm:inline text-charcoal-300">${escape_html(matches.length)} ${escape_html(matches.length === 1 ? "match" : "matches")} `);
      if (conflictCount > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="ml-2 text-warning-500">• ${escape_html(conflictCount)} ${escape_html(conflictCount === 1 ? "conflict" : "conflicts")}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (matches.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="text-xs sm:hidden text-charcoal-300">${escape_html(matches.length)} ${escape_html(matches.length === 1 ? "match" : "matches")} `);
      if (conflictCount > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="ml-2 text-warning-500">• ${escape_html(conflictCount)} ${escape_html(conflictCount === 1 ? "conflict" : "conflicts")}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap"><div class="flex items-center gap-1"><label for="role-selector-header" class="text-xs hidden sm:inline text-charcoal-300">I am a:</label> `);
    $$renderer2.select(
      {
        id: "role-selector-header",
        value: userRoleValue,
        onchange: (e) => userRole.setRole(e.target.value),
        class: "px-2 py-2 sm:py-1.5 text-xs rounded-lg transition-colors min-h-[44px] sm:min-h-0 bg-charcoal-700 text-charcoal-200 border border-charcoal-600",
        title: "Select your role to customize the app features for your needs",
        "aria-describedby": "role-help"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "media" }, ($$renderer4) => {
          $$renderer4.push(`📸 Photographer`);
        });
        $$renderer3.option({ value: "spectator" }, ($$renderer4) => {
          $$renderer4.push(`📊 Scorekeeper`);
        });
        $$renderer3.option({ value: "coach" }, ($$renderer4) => {
          $$renderer4.push(`📋 Coach`);
        });
      }
    );
    $$renderer2.push(` <span id="role-help" class="sr-only">Select your role to customize the app features for your needs</span></div> `);
    if (matches.length > 0) {
      $$renderer2.push("<!--[-->");
      if (!isCoachValue) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex items-center gap-1 rounded-lg p-1 bg-charcoal-700"><button${attr_class("px-3 py-2 sm:py-1.5 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0", void 0, {
          "bg-gold-500": viewMode === "list",
          "text-charcoal-950": viewMode === "list",
          "text-charcoal-300": viewMode !== "list",
          "hover:text-charcoal-50": viewMode !== "list"
        })}>List</button> <button${attr_class("px-3 py-2 sm:py-1.5 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0", void 0, {
          "bg-gold-500": viewMode === "timeline",
          "text-charcoal-950": viewMode === "timeline",
          "text-charcoal-300": viewMode !== "timeline",
          "hover:text-charcoal-50": viewMode !== "timeline"
        })}>Timeline</button></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (isMediaValue && selectedCountValue > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button${attr_class("px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[44px] sm:min-h-0 border", void 0, {
          "bg-gold-500": showCoveragePlan,
          "text-charcoal-950": showCoveragePlan,
          "text-gold-500": !showCoveragePlan
        })}${attr_style(showCoveragePlan ? "" : "background-color: rgba(234, 179, 8, 0.1); border-color: rgba(234, 179, 8, 0.2);")} title="View and manage your photography coverage schedule"${attr("aria-label", `My schedule with ${selectedCountValue} ${selectedCountValue === 1 ? "match" : "matches"}`)}><svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> My Schedule (${escape_html(selectedCountValue)})</button>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <button class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 min-h-[44px] sm:min-h-0" title="Export match data as JSON" aria-label="Export data as JSON"><svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path></svg> JSON</button> <button class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors bg-charcoal-700 text-charcoal-200 hover:text-charcoal-50 min-h-[44px] sm:min-h-0" title="Export to Excel (CSV format)" aria-label="Export to Excel"><svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path></svg> CSV</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button${attr_class("px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[44px] sm:min-h-0", void 0, {
      "bg-gold-500": showConfig,
      "text-charcoal-950": showConfig,
      "bg-charcoal-700": !showConfig,
      "text-charcoal-200": !showConfig
    })} title="Change event parameters and tournament settings"${attr("aria-label", "Show event settings")}><svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> ${escape_html("Event Settings")}</button></div></div></div></header> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <style>
		header.collapsed {
			max-height: 56px;
			overflow: hidden;
		}
		
		@media (max-width: 767px) {
			header.collapsed {
				max-height: 56px;
			}
			header:not(.collapsed) {
				max-height: 500px; /* Allow expansion */
			}
		}
	</style> <div class="flex flex-col lg:flex-row"><div class="hidden lg:block">`);
    Sidebar($$renderer2, {
      matches,
      collapsed: sidebarCollapsed,
      onToggle: () => sidebarCollapsed = !sidebarCollapsed
    });
    $$renderer2.push(`<!----></div> <main class="flex-1 w-full lg:container lg:mx-auto lg:px-6 lg:py-6"><div class="lg:hidden">`);
    MobileFilterBar($$renderer2, {
      onOpenFullFilters: () => {
        showFilterSheet = true;
        activeTab = "filters";
      }
    });
    $$renderer2.push(`<!----></div> <div class="px-4 py-4 pb-24 lg:px-0 lg:py-0">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (matches.length === 0 && true) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-center py-12 px-4 max-w-md mx-auto"><div class="w-16 h-16 mx-auto mb-4 rounded-full bg-charcoal-800 flex items-center justify-center"><svg class="w-8 h-8 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div> <h2 class="text-lg font-semibold text-charcoal-50 mb-2">Ready to Load Your Tournament</h2> <p class="text-sm text-charcoal-300 mb-4">Enter your event details to see the 630 Volleyball match schedule and plan your coverage</p> <button class="px-6 py-3 bg-gold-500 text-charcoal-950 rounded-lg font-medium hover:bg-gold-400 transition-colors min-h-[44px]" aria-label="Open event settings to get started">Get Started</button></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (matches.length > 0) {
      $$renderer2.push("<!--[-->");
      if (isCoachValue) {
        $$renderer2.push("<!--[-->");
        CoachView($$renderer2, { matches, eventId, clubId });
      } else {
        $$renderer2.push("<!--[!-->");
        {
          $$renderer2.push("<!--[-->");
          MatchList($$renderer2, { matches, eventId, clubId });
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (showCoveragePlan) {
      $$renderer2.push("<!--[-->");
      CoveragePlanPanel($$renderer2, { matches, onClose: closeCoveragePlan });
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></main></div> `);
    MobileBottomNav($$renderer2, { activeTab, onTabChange: handleTabChange });
    $$renderer2.push(`<!----> `);
    FilterBottomSheet($$renderer2, {
      matches,
      divisions,
      teams,
      open: showFilterSheet,
      onClose: closeFilterSheet
    });
    $$renderer2.push(`<!----> `);
    if (showMoreMenu) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity" role="dialog" aria-modal="true" aria-label="More options" tabindex="-1"><div class="fixed bottom-0 left-0 right-0 max-h-[60vh] bg-charcoal-950 rounded-t-lg border-t border-charcoal-900 overflow-y-auto" style="padding-bottom: env(safe-area-inset-bottom);" role="dialog" tabindex="-1"><div class="sticky top-0 bg-charcoal-950 border-b border-charcoal-900 px-4 py-3 flex items-center justify-between z-10"><h2 class="text-lg font-semibold text-charcoal-50">More</h2> <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-300 hover:text-charcoal-50 hover:bg-charcoal-900 transition-colors min-h-[44px]" aria-label="Close menu">×</button></div> <div class="p-4 space-y-2"><button type="button" class="w-full px-4 py-3 text-left rounded-lg bg-charcoal-800 text-charcoal-50 hover:bg-charcoal-700 transition-colors min-h-[44px]" aria-label="Open event settings"><div class="font-medium">Event Settings</div> <div class="text-xs text-charcoal-400 mt-0.5">Change tournament parameters and load schedule</div></button> `);
      if (matches.length > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button type="button" class="w-full px-4 py-3 text-left rounded-lg bg-charcoal-800 text-charcoal-50 hover:bg-charcoal-700 transition-colors min-h-[44px]"><div class="font-medium">Export JSON</div> <div class="text-xs text-charcoal-400 mt-0.5">Download matches as JSON</div></button> <button type="button" class="w-full px-4 py-3 text-left rounded-lg bg-charcoal-800 text-charcoal-50 hover:bg-charcoal-700 transition-colors min-h-[44px]"><div class="font-medium">Export CSV</div> <div class="text-xs text-charcoal-400 mt-0.5">Download matches as CSV</div></button>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="pt-2 border-t border-charcoal-700"><label for="role-selector-menu" class="block text-sm font-medium text-charcoal-300 mb-2">I am a:</label> `);
      $$renderer2.select(
        {
          id: "role-selector-menu",
          value: userRoleValue,
          onchange: (e) => {
            userRole.setRole(e.target.value);
          },
          class: "w-full px-3 py-2 rounded-lg text-sm min-h-[44px] focus:border-gold-500 focus:outline-none bg-charcoal-700 text-charcoal-200 border border-charcoal-600",
          "aria-label": "Select your role to customize features"
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "media" }, ($$renderer4) => {
            $$renderer4.push(`📸 Photographer`);
          });
          $$renderer3.option({ value: "spectator" }, ($$renderer4) => {
            $$renderer4.push(`📊 Scorekeeper`);
          });
          $$renderer3.option({ value: "coach" }, ($$renderer4) => {
            $$renderer4.push(`📋 Coach`);
          });
        }
      );
      $$renderer2.push(`</div> `);
      if (!isCoachValue) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="pt-2 border-t border-charcoal-700"><label for="view-mode-selector-menu" class="block text-xs font-medium text-charcoal-300 uppercase tracking-wider mb-2">View Mode</label> <div class="flex gap-2" role="group" aria-labelledby="view-mode-selector-menu"><button type="button" id="view-mode-list"${attr_class("flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]", void 0, {
          "bg-gold-500": viewMode === "list",
          "text-charcoal-950": viewMode === "list",
          "text-charcoal-300": viewMode !== "list",
          "hover:text-charcoal-50": viewMode !== "list",
          "bg-charcoal-700": viewMode !== "list"
        })}${attr("aria-pressed", viewMode === "list")}>List</button> <button type="button" id="view-mode-timeline"${attr_class("flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]", void 0, {
          "bg-gold-500": viewMode === "timeline",
          "text-charcoal-950": viewMode === "timeline",
          "text-charcoal-300": viewMode !== "timeline",
          "hover:text-charcoal-50": viewMode !== "timeline",
          "bg-charcoal-700": viewMode !== "timeline"
        })}${attr("aria-pressed", viewMode === "timeline")}>Timeline</button></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
