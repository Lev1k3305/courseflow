'use client';

import { useEffect } from 'react';
import { vkBridgeManager } from '@/lib/vkBridge';

/**
 * Component for VK Bridge initialization
 * Acts as a safety backup for ConditionalLayout initialization
 */
export function VKBridgeInitializer() {
  useEffect(() => {
    // Initialize VK Bridge when app loads
    vkBridgeManager.init().catch((error) => {
      console.warn('[VKBridgeInitializer] Initialization failed:', error);
      // App continues to work without VK Bridge
    });
  }, []);

  // Component doesn't render anything
  return null;
}