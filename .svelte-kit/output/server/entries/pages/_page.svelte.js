import { b as bind_props, e as ensure_array_like, a as attr_class, c as stringify, d as attr, f as store_get, u as unsubscribe_stores, g as attr_style } from "../../chunks/index2.js";
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
  priority: "all"
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
    $$renderer2.push(`<div class="mt-2 border border-[#454654] rounded-lg bg-[#3b3c48] overflow-hidden"><div class="p-3 sm:p-4"><div class="flex items-center justify-between mb-3 sm:mb-4"><h4 class="text-xs sm:text-sm font-semibold text-[#f8f8f9] truncate pr-2">${escape_html(teamName)} - Full Schedule</h4> <button class="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center" aria-label="Close panel"><svg class="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-center py-8 text-[#9fa2ab] text-sm">Loading schedule...</div>`);
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
    $$renderer2.push(`<div class="bg-[#3b3c48] border border-[#454654] rounded-lg p-2 shadow-lg min-w-[160px]"><div class="text-xs font-medium text-[#9fa2ab] uppercase tracking-wider mb-2 px-1">Set Priority</div> <div class="space-y-1"><!--[-->`);
    const each_array = ensure_array_like(priorityOptions);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let option = each_array[$$index];
      const isSelected = currentPriority === option.value;
      const isHovered = hoveredPriority === option.value;
      $$renderer2.push(`<button${attr_class(`w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${stringify(isSelected ? "bg-[#eab308]/20 text-[#facc15] border border-[#eab308]/50" : isHovered ? "bg-[#454654] text-[#f8f8f9]" : "text-[#c0c2c8] hover:bg-[#454654]")}`)}><span>${escape_html(option.icon)}</span> <span>${escape_html(option.label)}</span></button>`);
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
    $$renderer2.push(`<div class="bg-[#3b3c48] border border-[#454654] rounded-lg p-2 shadow-lg min-w-[180px]"><div class="text-xs font-medium text-[#9fa2ab] uppercase tracking-wider mb-2 px-1">Coverage Status</div> <div class="text-xs text-[#c0c2c8] mb-2 px-1">Team ${escape_html(teamId)}</div> <div class="space-y-1"><!--[-->`);
    const each_array = ensure_array_like(statusOptions);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let option = each_array[$$index];
      const isSelected = currentStatus === option.value;
      const isHovered = hoveredStatus === option.value;
      $$renderer2.push(`<button${attr_class(`w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${stringify(isSelected ? option.value === "covered" ? "bg-green-500/20 text-green-400 border border-green-500/50" : option.value === "planned" ? "bg-[#eab308]/20 text-[#facc15] border border-[#eab308]/50" : option.value === "partially-covered" ? "bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/50" : "bg-[#454654] text-[#9fa2ab] border border-[#525463]" : isHovered ? "bg-[#454654] text-[#f8f8f9]" : "text-[#c0c2c8] hover:bg-[#454654]")}`)}><span>${escape_html(option.icon)}</span> <span>${escape_html(option.label)}</span></button>`);
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
      $$renderer2.push(`<div class="px-2 py-1 text-xs font-medium rounded bg-[#454654] text-[#9fa2ab] border border-[#525463]">Claimed by ${escape_html(claimer)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (claimStatus === "claimed" && isOwner) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex items-center gap-1"><button class="px-2 py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors border border-[#525463]" title="Release claim">Release</button> <button class="px-2 py-1 text-xs font-medium rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors border border-[#525463]" title="Transfer claim to another scorer">Transfer</button></div> `);
        {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (claimStatus === "available") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<button class="px-2 py-1 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors" title="Claim this match for scoring">Claim Match</button>`);
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
      $$renderer2.push(`<div class="text-center py-8 text-[#9fa2ab] text-sm">No score history available</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="space-y-2"><h3 class="text-sm font-semibold text-[#f8f8f9] mb-3">Score History</h3> <div class="space-y-2 max-h-64 overflow-y-auto"><!--[-->`);
      const each_array = ensure_array_like(history.slice().reverse());
      for (let index = 0, $$length = each_array.length; index < $$length; index++) {
        let entry = each_array[index];
        const completedSets = entry.sets.filter((s) => s.completedAt > 0);
        const team1SetsWon = completedSets.filter((s) => s.team1Score > s.team2Score).length;
        const team2SetsWon = completedSets.filter((s) => s.team2Score > s.team1Score).length;
        const currentSet = entry.sets.find((s) => s.completedAt === 0) || entry.sets[entry.sets.length - 1];
        $$renderer2.push(`<div class="px-3 py-2 rounded-lg border border-[#454654] bg-[#3b3c48] text-xs"><div class="flex items-center justify-between mb-1"><div class="text-[#9fa2ab]">${escape_html(new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }))}</div> <div${attr_class(`px-2 py-0.5 rounded text-[10px] font-medium ${stringify(entry.status === "completed" ? "bg-green-500/20 text-green-400" : entry.status === "in-progress" ? "bg-[#eab308]/20 text-[#facc15]" : "bg-[#454654] text-[#9fa2ab]")}`)}>${escape_html(entry.status)}</div></div> `);
        if (completedSets.length > 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="text-[#c0c2c8] mb-1">Sets: ${escape_html(team1SetsWon)}-${escape_html(team2SetsWon)}</div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <div class="text-[#f8f8f9] font-semibold">Current: ${escape_html(currentSet.team1Score)}-${escape_html(currentSet.team2Score)}</div> <div class="text-[10px] text-[#808593] mt-1">Updated by ${escape_html(entry.updatedBy)}</div></div>`);
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
    $$renderer2.push(`<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div class="bg-[#3b3c48] rounded-lg border border-[#454654] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"><div class="sticky top-0 bg-[#3b3c48] border-b border-[#454654] px-4 py-3 flex items-center justify-between"><div><h2 class="text-lg font-semibold text-[#f8f8f9]">Scorekeeper</h2> <p class="text-sm text-[#9fa2ab]">${escape_html(team1Name)} vs ${escape_html(team2Name)}</p></div> <button class="text-[#9fa2ab] hover:text-[#f8f8f9] transition-colors" aria-label="Close scorekeeper">✕</button></div> <div class="p-4 space-y-4"><div class="flex items-center gap-2"><span class="text-xs text-[#9fa2ab] uppercase tracking-wider">Status:</span> `);
    $$renderer2.select(
      {
        value: status,
        class: "px-3 py-1 text-sm font-medium rounded bg-[#454654] text-[#c0c2c8] border border-[#525463] focus:border-[#eab308] focus:outline-none"
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
      $$renderer2.push(`<button class="w-full px-4 py-2 text-sm font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors">Start Match</button>`);
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
      $$renderer2.push(`<div class="bg-[#454654] rounded-lg border border-[#525463] p-4"><div class="text-xs text-[#9fa2ab] uppercase tracking-wider mb-2">Set ${escape_html(currentSet.setNumber)}</div> <div class="grid grid-cols-2 gap-4"><div class="text-center"><div class="text-xs text-[#9fa2ab] mb-1">${escape_html(team1Name)}</div> <div class="flex items-center justify-center gap-2"><button class="w-8 h-8 rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors font-bold">−</button> <div class="text-3xl font-bold text-[#f8f8f9] w-12 text-center">${escape_html(currentSet.team1Score)}</div> <button class="w-8 h-8 rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors font-bold">+</button></div></div> <div class="text-center"><div class="text-xs text-[#9fa2ab] mb-1">${escape_html(team2Name)}</div> <div class="flex items-center justify-center gap-2"><button class="w-8 h-8 rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors font-bold">−</button> <div class="text-3xl font-bold text-[#f8f8f9] w-12 text-center">${escape_html(currentSet.team2Score)}</div> <button class="w-8 h-8 rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors font-bold">+</button></div></div></div> <div class="flex gap-2 mt-4"><button class="flex-1 px-4 py-2 text-sm font-medium rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors">Complete Set</button> `);
      if (sets.length < 5) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button class="flex-1 px-4 py-2 text-sm font-medium rounded bg-[#525463] text-[#c0c2c8] hover:bg-[#454654] transition-colors">Add Set</button>`);
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
      $$renderer2.push(`<div><div class="text-xs text-[#9fa2ab] uppercase tracking-wider mb-2">Completed Sets</div> <div class="space-y-2"><!--[-->`);
      const each_array = ensure_array_like(completedSets);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let set = each_array[$$index];
        $$renderer2.push(`<div class="flex items-center justify-between px-3 py-2 bg-[#454654] rounded border border-[#525463]"><span class="text-sm text-[#9fa2ab]">Set ${escape_html(set.setNumber)}</span> <div class="flex items-center gap-4"><span class="text-sm font-medium text-[#f8f8f9]">${escape_html(team1Name)}: ${escape_html(set.team1Score)}</span> <span class="text-sm text-[#9fa2ab]">vs</span> <span class="text-sm font-medium text-[#f8f8f9]">${escape_html(team2Name)}: ${escape_html(set.team2Score)}</span></div></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (status === "in-progress" && completedSets.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button class="w-full px-4 py-2 text-sm font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors">Complete Match</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button${attr("disabled", isSaving, true)}${attr_class(`w-full px-4 py-2 text-sm font-medium rounded transition-colors border ${stringify("bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] border-[#525463]")}`)}>${escape_html("Save Score")}</button> `);
    if (status === "in-progress") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-xs text-[#9fa2ab] text-center">${escape_html("✓ Auto-save enabled")}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (currentScore) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="border-t border-[#454654] pt-4">`);
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
    $$renderer2.push(`<div class="relative"><button class="px-3 py-2 text-sm font-medium rounded-lg bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] border border-[#525463] hover:border-[#eab308] transition-colors">My Teams (${escape_html(
      // Available colors for team customization
      // Gold
      // Blue
      // Green
      // Orange
      // Red
      // Purple
      // Pink
      // Cyan
      store_get($$store_subs ??= {}, "$followedTeams", followedTeams).followedTeams.length
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
      $$renderer2.push(`<div class="mb-6 rounded-lg border border-[#454654] bg-[#3b3c48] p-4"><div class="flex items-center justify-between mb-4"><h2 class="text-lg font-semibold text-[#f8f8f9] flex items-center gap-2"><span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Live Now</h2> <span class="text-xs text-[#9fa2ab]">${escape_html(liveMatches.length)} match${escape_html(liveMatches.length !== 1 ? "es" : "")} in progress</span></div> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"><!--[-->`);
      const each_array = ensure_array_like(liveMatches);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let match = each_array[$$index];
        const score = matchClaiming.getScore(match.MatchId);
        const currentSet = score?.sets.find((s) => s.completedAt === 0) || score?.sets[score?.sets.length - 1];
        const completedSets = score?.sets.filter((s) => s.completedAt > 0) || [];
        const team1Wins = completedSets.filter((s) => s.team1Score > s.team2Score).length;
        const team2Wins = completedSets.filter((s) => s.team2Score > s.team1Score).length;
        $$renderer2.push(`<div class="px-4 py-3 rounded-lg border border-[#525463] bg-[#454654] hover:border-[#eab308] transition-colors cursor-pointer"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><span class="text-xs font-medium text-[#facc15]">${escape_html(match.CourtName)}</span> `);
        LiveScoreIndicator($$renderer2, {
          isLive: score?.status === "in-progress" || false,
          lastUpdated: score?.lastUpdated
        });
        $$renderer2.push(`<!----></div> <div class="text-xs text-[#9fa2ab]">${escape_html(formatMatchTime(match.ScheduledStartDateTime))}</div></div> <div class="space-y-1"><div class="text-sm font-semibold text-[#f8f8f9]">${escape_html(match.FirstTeamText)}</div> <div class="text-xs text-[#9fa2ab]">vs</div> <div class="text-sm font-semibold text-[#f8f8f9]">${escape_html(match.SecondTeamText)}</div></div> `);
        if (score && score.status !== "not-started" && currentSet) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="mt-3 pt-3 border-t border-[#525463]"><div class="flex items-center justify-between">`);
          if (completedSets.length > 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="text-xs text-[#9fa2ab]">Sets: ${escape_html(team1Wins)}-${escape_html(team2Wins)}</div>`);
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
function MatchList($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let conflicts, coverageStatusMap, coverageSuggestions, filteredMatches, opportunities, opportunityMatchIds, coverageStats, sortedMatches, matchesByStartTime, startTimes;
    let matches = $$props["matches"];
    let eventId = $$props["eventId"];
    let clubId = $$props["clubId"];
    let expandedMatch = null;
    let priorityMenuOpen = null;
    let coverageStatusMenuOpen = null;
    let showSuggestions = false;
    let scorekeeperMatch = null;
    let previousClaimedMatchIds = /* @__PURE__ */ new Set();
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
    {
      const isSpectatorValue = store_get($$store_subs ??= {}, "$isSpectator", isSpectator);
      matchClaiming = createMatchClaiming({
        eventId,
        userId: isSpectatorValue ? "spectator" : "anonymous"
      });
    }
    conflicts = detectConflicts(matches);
    (() => {
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
    getUniqueTeams(matches);
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
    coverageSuggestions = (() => {
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
      if (store_get($$store_subs ??= {}, "$isSpectator", isSpectator)) {
        let followedTeamIds = [];
        followedTeams.subscribe((teams) => {
          followedTeamIds = teams.map((t) => t.teamId);
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
      followedTeams.subscribe((teams) => {
        followedTeamIds = teams.map((t) => t.teamId);
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
      $$renderer2.push(`<div class="text-center py-12 text-[#9fa2ab] text-sm">${escape_html(store_get($$store_subs ??= {}, "$filters", filters).division || store_get($$store_subs ??= {}, "$filters", filters).wave !== "all" || store_get($$store_subs ??= {}, "$filters", filters).teams.length > 0 || store_get($$store_subs ??= {}, "$filters", filters).timeRange.start || store_get($$store_subs ??= {}, "$filters", filters).timeRange.end ? "No matches found for selected filters" : "No matches found")}</div>`);
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
        $$renderer2.push(`<div class="mb-4 px-4 py-2 rounded-lg border border-[#454654] bg-[#3b3c48] flex items-center justify-between flex-wrap gap-2"><div class="flex items-center gap-4 flex-wrap"><div class="text-xs text-[#9fa2ab]"><span class="font-semibold text-[#f8f8f9]">${escape_html(coverageStats.coveragePercentage.toFixed(0))}%</span> Coverage</div> <div class="flex items-center gap-2 text-xs"><span class="text-green-400">✓ ${escape_html(coverageStats.coveredTeams)}</span> <span class="text-[#9fa2ab]">/</span> <span class="text-[#f59e0b]">◐ ${escape_html(coverageStats.partiallyCoveredTeams)}</span> <span class="text-[#9fa2ab]">/</span> <span class="text-[#eab308]">📋 ${escape_html(coverageStats.plannedTeams)}</span> <span class="text-[#9fa2ab]">/</span> <span class="text-[#808593]">○ ${escape_html(coverageStats.uncoveredTeams)}</span></div></div> <div class="flex items-center gap-2 flex-wrap"><button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify("bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] border border-[#525463]")}`)} title="Dim covered teams to focus on uncovered">${escape_html("Scanning Mode")}</button> `);
        if (coverageSuggestions.length > 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify("bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] border border-[#525463]")}`)}${attr("title", `${stringify(coverageSuggestions.length)} coverage suggestions`)}>💡 Suggestions (${escape_html(coverageSuggestions.length)})</button>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div>`);
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
        $$renderer2.push(`<div class="mb-4 px-3 py-2 rounded-lg border border-[#454654] bg-[#3b3c48] text-xs"><div class="font-medium text-[#9fa2ab] uppercase tracking-wider mb-2">Coverage Status Legend</div> <div class="flex flex-wrap gap-4 text-[#c0c2c8]"><div class="flex items-center gap-1.5"><div class="w-4 h-4 rounded border border-[#eab308] bg-[#eab308]/5"></div> <span>Uncovered</span></div> <div class="flex items-center gap-1.5"><div class="w-4 h-4 rounded border border-[#eab308]/50 bg-[#eab308]/10"></div> <span>Planned</span></div> <div class="flex items-center gap-1.5"><div class="w-4 h-4 rounded border border-green-500/30 bg-green-950/5"></div> <span>Covered</span></div> <div class="flex items-center gap-1.5"><div class="w-4 h-4 rounded border border-red-800/50 bg-red-950/10"></div> <span>Conflict</span></div></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4"><div class="flex items-center gap-2"><span class="text-xs text-[#9fa2ab] uppercase tracking-wider">Sort:</span> <div class="flex gap-1 bg-[#454654] rounded-lg p-1"><button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify(
        "bg-[#eab308] text-[#18181b]"
      )}`)}>Team</button> <button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify("text-[#c0c2c8] hover:text-[#f8f8f9]")}`)}>Court</button> <button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify("text-[#c0c2c8] hover:text-[#f8f8f9]")}`)}>Time</button></div></div> <div class="flex items-center gap-2"><span class="text-xs text-[#9fa2ab] uppercase tracking-wider">Wave:</span> <div class="flex gap-1 bg-[#454654] rounded-lg p-1"><button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify(store_get($$store_subs ??= {}, "$filters", filters).wave === "all" ? "bg-[#eab308] text-[#18181b]" : "text-[#c0c2c8] hover:text-[#f8f8f9]")}`)}>All</button> <button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify(store_get($$store_subs ??= {}, "$filters", filters).wave === "morning" ? "bg-[#eab308] text-[#18181b]" : "text-[#c0c2c8] hover:text-[#f8f8f9]")}`)}>Morning</button> <button${attr_class(`px-3 py-2 sm:py-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0 ${stringify(store_get($$store_subs ??= {}, "$filters", filters).wave === "afternoon" ? "bg-[#eab308] text-[#18181b]" : "text-[#c0c2c8] hover:text-[#f8f8f9]")}`)}>Afternoon</button></div></div> `);
      if (store_get($$store_subs ??= {}, "$isSpectator", isSpectator)) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex items-center gap-2">`);
        MyTeamsSelector($$renderer2, { matches });
        $$renderer2.push(`<!----></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="space-y-4">`);
      if (startTimes.length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="text-center py-12 text-[#9fa2ab] text-sm">No matches found</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(startTimes);
        for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
          let startTime = each_array_1[$$index_2];
          const timeMatches = matchesByStartTime[startTime];
          const timeConflicts = timeMatches.filter((m) => conflicts.has(m.MatchId)).length;
          const hasAnyConflict = timeConflicts > 0;
          const allHaveConflicts = timeConflicts === timeMatches.length;
          $$renderer2.push(`<div class="space-y-1.5"><div class="flex items-center justify-between mb-2 pb-1 border-b border-[#454654]"><div class="flex items-center gap-2"><h3 class="text-base font-semibold text-[#f8f8f9]">${escape_html(startTime)}</h3> <span class="text-xs text-[#9fa2ab]">${escape_html(timeMatches.length)} match${escape_html(timeMatches.length !== 1 ? "es" : "")}</span></div> `);
          if (hasAnyConflict) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<span${attr_class(`text-xs font-medium ${stringify(allHaveConflicts ? "text-[#808593]" : "text-red-400")}`)}>${escape_html(timeConflicts)} conflict${escape_html(timeConflicts !== 1 ? "s" : "")}</span>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div> <!--[-->`);
          const each_array_2 = ensure_array_like(timeMatches);
          for (let index = 0, $$length2 = each_array_2.length; index < $$length2; index++) {
            let match = each_array_2[index];
            const hasConflict = conflicts.has(match.MatchId);
            const teamId = getTeamIdentifier(match);
            const opponent = getOpponent(match);
            const isExpanded = expandedMatch === match.MatchId;
            const matchPriority = priority.getPriority(match.MatchId);
            const isOpportunity = opportunityMatchIds.has(match.MatchId);
            const teamCoverageStatus = teamId ? coverageStatus.getTeamStatus(teamId) : "not-covered";
            const isCovered = teamCoverageStatus === "covered" || teamCoverageStatus === "partially-covered";
            const isPlanned = teamCoverageStatus === "planned";
            const isUncovered = teamCoverageStatus === "not-covered";
            const currentPlan = get(coveragePlan);
            const isSelected = currentPlan.has(match.MatchId);
            const showConflictStyling = hasConflict && !allHaveConflicts;
            $$renderer2.push(`<div><div${attr_class(`group relative rounded transition-all flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2.5 sm:py-2 cursor-pointer match-card min-h-[44px] sm:min-h-0 ${stringify(showConflictStyling ? "border border-red-800/50 bg-red-950/10" : matchPriority === "must-cover" ? "border-2 border-[#eab308] bg-[#eab308]/10" : matchPriority === "priority" ? "border border-[#f59e0b] bg-[#f59e0b]/10" : isUncovered && !isSelected ? "border border-[#eab308] bg-[#eab308]/5" : isPlanned ? "border border-[#eab308]/50 bg-[#eab308]/10" : isCovered ? "border border-green-500/30 bg-green-950/5" : isOpportunity && !isSelected ? "border border-green-500/50 bg-green-950/10" : isSelected ? "border border-[#eab308]/50 bg-[#eab308]/10" : "border border-[#454654] bg-[#3b3c48]")} ${stringify("")} hover:border-[#525463] hover:bg-[#3b3c48]/80`)}>`);
            if (store_get($$store_subs ??= {}, "$isMedia", isMedia)) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<button${attr_class(`absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 flex-shrink-0 w-5 h-5 rounded border-2 ${stringify(isSelected ? "border-[#eab308] bg-[#eab308]/20" : "border-[#525463] bg-transparent")} flex items-center justify-center hover:bg-[#454654] transition-colors`)}${attr("aria-label", isSelected ? "Remove from plan" : "Add to plan")}>`);
              if (isSelected) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<svg class="w-3 h-3 text-[#facc15]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--></button>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> <div class="flex-1 min-w-0"><div class="text-sm font-semibold text-[#f8f8f9]">${escape_html(formatMatchTime(match.ScheduledStartDateTime))}</div> <div class="text-xs text-[#9fa2ab]">${escape_html(match.CourtName)} • ${escape_html(teamId || match.Division.CodeAlias)} vs ${escape_html(opponent)}</div></div> `);
            if (store_get($$store_subs ??= {}, "$isMedia", isMedia)) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="relative"><button${attr_class(`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-[#454654] ${stringify(matchPriority === "must-cover" ? "text-[#eab308]" : matchPriority === "priority" ? "text-[#f59e0b]" : matchPriority === "optional" ? "text-[#9fa2ab]" : "text-[#808593]")}`)} aria-label="Set priority"${attr("title", matchPriority ? `Priority: ${matchPriority}` : "Set priority")}>${escape_html(matchPriority === "must-cover" && "⭐")}
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
                $$renderer2.push(`<div class="absolute left-0 top-8 z-50">`);
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
              $$renderer2.push(`<div class="relative"><button${attr_class(`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-[#454654] ${stringify(teamCoverageStatus === "covered" ? "text-green-500" : teamCoverageStatus === "partially-covered" ? "text-[#f59e0b]" : teamCoverageStatus === "planned" ? "text-[#eab308]" : "text-[#808593]")}`)} aria-label="Set coverage status"${attr("title", `Coverage: ${stringify(teamCoverageStatus)}`)}>${escape_html(teamCoverageStatus === "covered" && "✓")}
												${escape_html(teamCoverageStatus === "partially-covered" && "◐")}
												${escape_html(teamCoverageStatus === "planned" && "📋")}
												${escape_html(teamCoverageStatus === "not-covered" && "○")}</button> `);
              if (coverageStatusMenuOpen === teamId) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="absolute left-0 top-8 z-50">`);
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
                $$renderer2.push(`<div class="flex-shrink-0"><button${attr_class(`px-2 py-1 text-xs font-medium rounded transition-colors ${stringify(followedTeams.isFollowing(teamId) ? "bg-[#eab308] text-[#18181b]" : "bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] border border-[#525463]")}`)}${attr("title", followedTeams.isFollowing(teamId) ? "Unfollow team" : "Follow team")}>${escape_html(followedTeams.isFollowing(teamId) ? "✓" : "+")}</button></div>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--> <div class="flex-shrink-0 flex items-center gap-2">`);
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
              $$renderer2.push(`<!----> <button class="px-2 py-1 text-xs font-medium rounded bg-[#454654] text-[#c0c2c8] hover:bg-[#525463] transition-colors border border-[#525463]" title="View claim history for this match">📜</button> `);
              if (claimStatus === "claimed" && isOwner) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<button class="px-2 py-1 text-xs font-medium rounded bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors border border-[#eab308]" title="Start keeping score for this match">${escape_html(score ? "Update Score" : "Start Scoring")}</button>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--> `);
              if (score && score.status !== "not-started") {
                $$renderer2.push("<!--[-->");
                const currentSet = score.sets.find((s) => s.completedAt === 0) || score.sets[score.sets.length - 1];
                const completedSets = score.sets.filter((s) => s.completedAt > 0);
                const team1Wins = completedSets.filter((s) => s.team1Score > s.team2Score).length;
                const team2Wins = completedSets.filter((s) => s.team2Score > s.team1Score).length;
                $$renderer2.push(`<div class="flex-shrink-0 flex items-center gap-2">`);
                if (completedSets.length > 0) {
                  $$renderer2.push("<!--[-->");
                  $$renderer2.push(`<div class="text-xs font-medium text-[#9fa2ab]">${escape_html(team1Wins)}-${escape_html(team2Wins)}</div>`);
                } else {
                  $$renderer2.push("<!--[!-->");
                }
                $$renderer2.push(`<!--]--> <div class="text-xs font-semibold text-[#f8f8f9]">${escape_html(currentSet.team1Score)}-${escape_html(currentSet.team2Score)}</div> `);
                LiveScoreIndicator($$renderer2, {
                  isLive: score.status === "in-progress",
                  lastUpdated: score.lastUpdated
                });
                $$renderer2.push(`<!----></div>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--> `);
              if (!isOwner && score && score.status !== "not-started") {
                $$renderer2.push("<!--[-->");
                const currentSet = score.sets.find((s) => s.completedAt === 0) || score.sets[score.sets.length - 1];
                const completedSets = score.sets.filter((s) => s.completedAt > 0);
                const team1Wins = completedSets.filter((s) => s.team1Score > s.team2Score).length;
                const team2Wins = completedSets.filter((s) => s.team2Score > s.team1Score).length;
                $$renderer2.push(`<div class="flex-shrink-0 flex items-center gap-2">`);
                if (completedSets.length > 0) {
                  $$renderer2.push("<!--[-->");
                  $$renderer2.push(`<div class="text-xs font-medium text-[#9fa2ab]">${escape_html(team1Wins)}-${escape_html(team2Wins)}</div>`);
                } else {
                  $$renderer2.push("<!--[!-->");
                }
                $$renderer2.push(`<!--]--> <div class="text-xs font-semibold text-[#f8f8f9]">${escape_html(currentSet.team1Score)}-${escape_html(currentSet.team2Score)}</div> `);
                LiveScoreIndicator($$renderer2, {
                  isLive: score.status === "in-progress",
                  lastUpdated: score.lastUpdated
                });
                $$renderer2.push(`<!----> <span class="text-[8px] text-[#9fa2ab]">(Live)</span></div>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--></div>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> <div class="flex-shrink-0 w-4"><svg${attr_class(`w-4 h-4 text-[#9fa2ab] transition-transform ${stringify(isExpanded ? "rotate-180" : "")}`)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div> `);
            if (isExpanded) {
              $$renderer2.push("<!--[-->");
              TeamDetailPanel($$renderer2, {
                match,
                eventId,
                clubId,
                onClose: () => expandedMatch = null,
                matches
              });
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></div>`);
          }
          $$renderer2.push(`<!--]--></div>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div> `);
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
        $$renderer2.push(`<div class="fixed bottom-4 right-4 z-50"><div class="relative"><button class="px-4 py-2 text-sm font-medium rounded-lg bg-[#eab308] text-[#18181b] hover:bg-[#facc15] transition-colors shadow-lg flex items-center gap-2" title="Score sharing &amp; sync options"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Scores</button> `);
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
    $$renderer2.push(`<div class="space-y-4"><div class="flex items-center justify-between flex-wrap gap-4"><div><h1 class="text-xl font-bold text-[#f8f8f9]">Coach View</h1> <p class="text-sm text-[#9fa2ab] mt-1">View matches and work assignments by team</p></div> <div class="flex items-center gap-2 bg-[#454654] rounded-lg p-1"><button${attr_class(`px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] ${stringify(
      "bg-[#eab308] text-[#18181b]"
    )}`)}>Matches</button> <button${attr_class(`px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] ${stringify("text-[#c0c2c8] hover:text-[#f8f8f9]")}`)}>Work Assignments</button></div></div> `);
    if (teams.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="border-b border-[#454654] pb-4"><div class="flex items-center gap-2 flex-wrap"><span class="text-xs text-[#9fa2ab] uppercase tracking-wider">Select Team:</span> <!--[-->`);
      const each_array = ensure_array_like(sortedTeams);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let teamId = each_array[$$index];
        $$renderer2.push(`<button${attr_class(`px-3 py-2 text-xs font-medium rounded transition-colors min-h-[44px] ${stringify(selectedTeam === teamId ? "bg-[#eab308] text-[#18181b]" : "bg-[#454654] text-[#c0c2c8] hover:text-[#f8f8f9] border border-[#525463]")}`)}>${escape_html(teamId)} `);
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
      $$renderer2.push(`<div class="text-center py-12 text-[#9fa2ab] text-sm">Select a team to view matches and work assignments</div>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { matches, eventId, clubId });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let conflictCount, selectedCountValue, isMediaValue, isCoachValue, userRoleValue;
    let eventId = "PTAwMDAwNDEzMTQ90";
    let matches = [];
    let viewMode = "list";
    let showConfig = false;
    let clubId = 24426;
    let showCoveragePlan = false;
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
    $$renderer2.push(`<div class="min-h-screen" style="background-color: #18181b;"><header class="border-b sticky top-0 z-10" style="border-color: #454654; background-color: rgba(59, 60, 72, 0.5);"><div class="container mx-auto px-3 sm:px-4 py-2 sm:py-3"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4"><div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 sm:gap-4 min-w-0 flex-1"><div class="flex items-center gap-2 min-w-0"><h1 class="text-base sm:text-lg font-semibold truncate" style="color: #f8f8f9;">630 Volleyball Coverage</h1> `);
    if (matches.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="text-xs whitespace-nowrap hidden sm:inline" style="color: #9fa2ab;">${escape_html(matches.length)} matches `);
      if (conflictCount > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="ml-2" style="color: #ef4444;">• ${escape_html(conflictCount)} conflicts</span>`);
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
    $$renderer2.push(`<!--]--> `);
    if (matches.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="text-xs sm:hidden" style="color: #9fa2ab;">${escape_html(matches.length)} matches `);
      if (conflictCount > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="ml-2" style="color: #ef4444;">• ${escape_html(conflictCount)} conflicts</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap"><div class="flex items-center gap-1"><label class="text-xs hidden sm:inline" style="color: #9fa2ab;">Role:</label> `);
    $$renderer2.select(
      {
        value: userRoleValue,
        onchange: (e) => userRole.setRole(e.target.value),
        class: "px-2 py-2 sm:py-1.5 text-xs rounded-lg transition-colors min-h-[44px] sm:min-h-0",
        style: "background-color: #454654; color: #c0c2c8; border: 1px solid #525463;",
        title: "Select your role"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "media" }, ($$renderer4) => {
          $$renderer4.push(`Media`);
        });
        $$renderer3.option({ value: "spectator" }, ($$renderer4) => {
          $$renderer4.push(`Spectator`);
        });
        $$renderer3.option({ value: "coach" }, ($$renderer4) => {
          $$renderer4.push(`Coach`);
        });
      }
    );
    $$renderer2.push(`</div> `);
    if (matches.length > 0) {
      $$renderer2.push("<!--[-->");
      if (!isCoachValue) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex items-center gap-1 rounded-lg p-1" style="background-color: #454654;"><button${attr_class("px-3 py-2 sm:py-1.5 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0", void 0, {
          "bg-gold-500": viewMode === "list",
          "text-charcoal-950": viewMode === "list",
          "text-charcoal-300": viewMode !== "list",
          "hover:text-charcoal-50": viewMode !== "list"
        })}${attr_style(
          "background-color: #eab308; color: #18181b;"
        )}>List</button> <button${attr_class("px-3 py-2 sm:py-1.5 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0", void 0, {
          "bg-gold-500": viewMode === "timeline",
          "text-charcoal-950": viewMode === "timeline",
          "text-charcoal-300": viewMode !== "timeline",
          "hover:text-charcoal-50": viewMode !== "timeline"
        })}${attr_style("color: #c0c2c8;")}>Timeline</button></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (isMediaValue && selectedCountValue > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button${attr_class("px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[44px] sm:min-h-0", void 0, { "text-charcoal-950": showCoveragePlan })}${attr_style("background-color: #454654; color: #c0c2c8;")}>Plan (${escape_html(selectedCountValue)})</button>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <button class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors hover:text-[#f8f8f9] min-h-[44px] sm:min-h-0" style="background-color: #454654; color: #c0c2c8;" title="Export JSON">JSON</button> <button class="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors hover:text-[#f8f8f9] min-h-[44px] sm:min-h-0" style="background-color: #454654; color: #c0c2c8;" title="Export CSV">CSV</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button${attr_class("px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg transition-colors min-h-[44px] sm:min-h-0", void 0, { "text-charcoal-950": showConfig })}${attr_style("background-color: #454654; color: #c0c2c8;")}>${escape_html("Config")}</button></div></div></div></header> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <main class="container mx-auto px-3 sm:px-4 py-4 sm:py-6">`);
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
      $$renderer2.push(`<div class="text-center py-12" style="color: #9fa2ab;"><div class="text-sm">No matches found for 630 Volleyball</div> <div class="text-xs mt-2" style="color: #808593;">Click "Config" to change event parameters</div></div>`);
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
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></main></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
