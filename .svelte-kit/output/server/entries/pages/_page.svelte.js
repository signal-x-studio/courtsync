import { a as store_get, b as attr_class, c as attr_style, u as unsubscribe_stores } from "../../chunks/index2.js";
import { d as derived, w as writable, g as get } from "../../chunks/index.js";
import { X as escape_html } from "../../chunks/context.js";
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
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let conflictCount, selectedCountValue, isMediaValue, isCoachValue, userRoleValue;
    let matches = [];
    let viewMode = "list";
    let showConfig = false;
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
        $$renderer2.push(`<div class="text-[#9fa2ab]">CoachView component - To be migrated</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="text-[#9fa2ab]">MatchList component - To be migrated</div>`);
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
