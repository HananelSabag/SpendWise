/**
 * 🔄 AUTO-REGENERATION HOOK
 * Automatically maintains 3-month buffer of upcoming transactions
 * @version 1.0.0 - SMART REGENERATION SYSTEM
 */

import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useNotifications } from '../stores';

const REGENERATION_THRESHOLD_DAYS = 30; // Regenerate when less than 30 days ahead
const CHECK_INTERVAL_MS = 1000 * 60 * 60; // Check every hour

export const useAutoRegeneration = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  // ✅ CHECK REGENERATION STATUS
  const {
    data: regenerationStatus,
    isLoading: checkingStatus,
    refetch: checkRegenerationStatus
  } = useQuery({
    queryKey: ['regenerationStatus'],
    queryFn: async () => {
      try {
        // Get upcoming transactions to analyze buffer
        const response = await api.transactions.getUpcomingTransactions();
        if (!response.success) {
          throw new Error('Failed to fetch upcoming transactions');
        }

        const upcomingTransactions = response.data.data || [];
        
        if (upcomingTransactions.length === 0) {
          return {
            needsRegeneration: false,
            daysAhead: 0,
            reason: 'No upcoming transactions found'
          };
        }

        // Find the furthest upcoming transaction date
        const furthestDate = Math.max(
          ...upcomingTransactions.map(t => new Date(t.date).getTime())
        );
        
        const daysAhead = Math.ceil((furthestDate - Date.now()) / (1000 * 60 * 60 * 24));
        const needsRegeneration = daysAhead < REGENERATION_THRESHOLD_DAYS;

        return {
          needsRegeneration,
          daysAhead,
          totalUpcoming: upcomingTransactions.length,
          reason: needsRegeneration 
            ? `Only ${daysAhead} days ahead (threshold: ${REGENERATION_THRESHOLD_DAYS})`
            : `${daysAhead} days ahead - sufficient buffer`
        };

      } catch (error) {
        console.error('Failed to check regeneration status:', error);
        return {
          needsRegeneration: false,
          daysAhead: 0,
          error: error.message,
          reason: 'Failed to check status'
        };
      }
    },
    staleTime: CHECK_INTERVAL_MS,
    refetchInterval: CHECK_INTERVAL_MS,
    refetchOnWindowFocus: false,
    retry: 3
  });

  // ✅ AUTO-REGENERATION MUTATION
  const autoRegenerateMutation = useMutation({
    mutationFn: async () => {
      // Get all active recurring templates
      const templatesResponse = await api.transactions.getRecurringTemplates();
      if (!templatesResponse.success) {
        throw new Error('Failed to fetch recurring templates');
      }

      const activeTemplates = (templatesResponse.data.data || []).filter(
        template => template.is_active !== false
      );

      if (activeTemplates.length === 0) {
        throw new Error('No active recurring templates found');
      }

      // Regenerate upcoming transactions for each template
      const regenerationResults = [];
      for (const template of activeTemplates) {
        try {
          // This would typically call a server endpoint that regenerates
          // upcoming transactions for a specific template
          const result = await api.transactions.regenerateUpcomingForTemplate(template.id);
          regenerationResults.push({
            templateId: template.id,
            templateName: template.name,
            success: result.success,
            count: result.data?.count || 0
          });
        } catch (error) {
          regenerationResults.push({
            templateId: template.id,
            templateName: template.name,
            success: false,
            error: error.message
          });
        }
      }

      return regenerationResults;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const totalGenerated = results.reduce((sum, r) => sum + (r.count || 0), 0);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['upcomingTransactions']);
      queryClient.invalidateQueries(['regenerationStatus']);

      addNotification({
        type: 'success',
        title: 'Auto-Regeneration Complete',
        message: `Successfully regenerated ${totalGenerated} upcoming transactions across ${successCount} templates.`
      });

      console.log('Auto-regeneration completed:', {
        templates: results.length,
        successful: successCount,
        totalGenerated
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Auto-Regeneration Failed',
        message: error.message || 'Failed to regenerate upcoming transactions'
      });

      console.error('Auto-regeneration failed:', error);
    }
  });

  // ✅ MANUAL REGENERATION TRIGGER
  const triggerRegeneration = useCallback(() => {
    return autoRegenerateMutation.mutateAsync();
  }, [autoRegenerateMutation]);

  // ✅ AUTO-TRIGGER EFFECT
  useEffect(() => {
    if (regenerationStatus?.needsRegeneration && !autoRegenerateMutation.isPending) {
      console.log('Auto-regeneration triggered:', regenerationStatus.reason);
      
      // Add a small delay to prevent rapid regeneration
      const timeout = setTimeout(() => {
        triggerRegeneration().catch(error => {
          console.error('Auto-regeneration trigger failed:', error);
        });
      }, 5000); // 5 second delay

      return () => clearTimeout(timeout);
    }
  }, [regenerationStatus?.needsRegeneration, autoRegenerateMutation.isPending, triggerRegeneration]);

  return {
    // Status
    regenerationStatus,
    isCheckingStatus: checkingStatus,
    isRegenerating: autoRegenerateMutation.isPending,
    
    // Actions
    checkRegenerationStatus,
    triggerRegeneration,
    
    // Errors
    regenerationError: autoRegenerateMutation.error,
    
    // Config
    thresholdDays: REGENERATION_THRESHOLD_DAYS,
    checkInterval: CHECK_INTERVAL_MS
  };
};

export default useAutoRegeneration;