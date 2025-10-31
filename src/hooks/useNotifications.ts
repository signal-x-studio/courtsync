import { useState, useEffect, useCallback } from 'react';
import type { FilteredMatch } from '../types';
import type { MatchScore } from '../types';

export interface NotificationPreferences {
  upcomingMatchReminder: boolean;
  reminderMinutes: number; // e.g., 5 minutes before match
  scoreUpdateNotification: boolean;
  browserNotifications: boolean;
}

const STORAGE_KEY_NOTIFICATIONS = 'notificationPreferences';
const DEFAULT_PREFERENCES: NotificationPreferences = {
  upcomingMatchReminder: true,
  reminderMinutes: 5,
  scoreUpdateNotification: true,
  browserNotifications: false,
};

/**
 * Hook for managing match notifications
 */
export const useNotifications = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const prefsData = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (prefsData) {
        const parsed = JSON.parse(prefsData) as NotificationPreferences;
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }

    // Check browser notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }, [preferences]);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Check for upcoming matches and send reminders
  const checkUpcomingMatches = useCallback((matches: FilteredMatch[], followedTeamIds: string[]) => {
    if (!preferences.upcomingMatchReminder) return;

    const now = Date.now();
    const reminderTime = preferences.reminderMinutes * 60 * 1000; // Convert to milliseconds

    matches.forEach(match => {
      const matchTime = match.ScheduledStartDateTime;
      const timeUntilMatch = matchTime - now;

      // Check if match is starting soon and involves a followed team
      const teamId = match.FirstTeamText || match.SecondTeamText;
      if (followedTeamIds.includes(teamId) && timeUntilMatch > 0 && timeUntilMatch <= reminderTime) {
        // Check if we've already notified for this match
        const notificationKey = `reminder-${match.MatchId}`;
        const lastNotified = localStorage.getItem(notificationKey);
        if (!lastNotified || Date.now() - parseInt(lastNotified) > reminderTime) {
          const minutesUntil = Math.floor(timeUntilMatch / 60000);
          showNotification(
            `Match starting in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`,
            `${match.FirstTeamText} vs ${match.SecondTeamText}\n${new Date(matchTime).toLocaleTimeString()} - ${match.CourtName}`,
            preferences.browserNotifications
          );
          localStorage.setItem(notificationKey, Date.now().toString());
        }
      }
    });
  }, [preferences]);

  // Show score update notification
  const notifyScoreUpdate = useCallback((match: FilteredMatch, score: MatchScore) => {
    if (!preferences.scoreUpdateNotification) return;

    const currentSet = score.sets.find(s => s.completedAt === 0) || score.sets[score.sets.length - 1];
    const completedSets = score.sets.filter(s => s.completedAt > 0);
    const team1Wins = completedSets.filter(s => s.team1Score > s.team2Score).length;
    const team2Wins = completedSets.filter(s => s.team2Score > s.team1Score).length;

    let message = `Score: ${currentSet.team1Score}-${currentSet.team2Score}`;
    if (completedSets.length > 0) {
      message = `Sets: ${team1Wins}-${team2Wins} | ${message}`;
    }

    showNotification(
      `${match.FirstTeamText} vs ${match.SecondTeamText}`,
      message,
      preferences.browserNotifications
    );
  }, [preferences]);

  // Show notification (in-app or browser)
  const showNotification = useCallback((title: string, body: string, useBrowser: boolean = false) => {
    if (useBrowser && notificationPermission === 'granted' && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/favicon.ico', // You can customize this
        tag: 'courtsync-notification',
      });
    } else {
      // In-app notification (you can implement a toast system here)
      console.log(`[Notification] ${title}: ${body}`);
      // For now, we'll use alert as a fallback
      // In a production app, you'd use a toast notification library
    }
  }, [notificationPermission]);

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  return {
    preferences,
    notificationPermission,
    requestPermission,
    checkUpcomingMatches,
    notifyScoreUpdate,
    updatePreferences,
  };
};

