"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRepository } from '@/lib/repo/repository-factory';
import { Database, HardDrive, Wifi, WifiOff } from 'lucide-react';

interface RepositoryInfo {
  type: 'local' | 'supabase' | 'unknown';
  isAvailable: boolean;
  error?: string;
}

export function RepositoryStatus() {
  const [repoInfo, setRepoInfo] = useState<RepositoryInfo>({
    type: 'unknown',
    isAvailable: false
  });

  useEffect(() => {
    const checkRepository = async () => {
      try {
        const repo = getRepository();
        
        // Determine repository type by checking constructor name
        const repoTypeName = repo.constructor.name;
        
        if (repoTypeName.includes('Supabase')) {
          setRepoInfo({
            type: 'supabase',
            isAvailable: true
          });
        } else if (repoTypeName.includes('Local')) {
          setRepoInfo({
            type: 'local',
            isAvailable: true
          });
        } else {
          setRepoInfo({
            type: 'unknown',
            isAvailable: true
          });
        }

        // Test basic connectivity
        await repo.getTasks();
        
      } catch (error) {
        setRepoInfo({
          type: 'unknown',
          isAvailable: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    checkRepository();
  }, []);

  const getIcon = () => {
    if (!repoInfo.isAvailable) return <WifiOff className="h-4 w-4" />;
    
    switch (repoInfo.type) {
      case 'supabase':
        return <Database className="h-4 w-4" />;
      case 'local':
        return <HardDrive className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    if (!repoInfo.isAvailable) return 'destructive';
    return repoInfo.type === 'supabase' ? 'default' : 'secondary';
  };

  const getStatusText = () => {
    if (!repoInfo.isAvailable) return 'Offline';
    
    switch (repoInfo.type) {
      case 'supabase':
        return 'Supabase Connected';
      case 'local':
        return 'Local Storage';
      default:
        return 'Unknown Backend';
    }
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span className="text-sm font-medium">Storage Backend</span>
        </div>
        <Badge variant={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </div>
      
      {repoInfo.error && (
        <div className="mt-2 text-xs text-muted-foreground">
          Error: {repoInfo.error}
        </div>
      )}
      
      {repoInfo.type === 'local' && (
        <div className="mt-2 text-xs text-muted-foreground">
          Data stored locally. Configure Supabase for cloud sync.
        </div>
      )}
      
      {repoInfo.type === 'supabase' && (
        <div className="mt-2 text-xs text-muted-foreground">
          Data synced to cloud database. Changes persist across devices.
        </div>
      )}
    </Card>
  );
}
