import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Resource, ResourceType } from '@/components/ResourceList';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Loader2, RefreshCw, ExternalLink, BookmarkPlus, BookmarkCheck,
  FileText, Video, BookOpen, Book, GraduationCap, Wrench,
  Headphones, Rss, Users, Github, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface SuggestedResource extends Resource {
  relatedConcepts?: string[];
  relatedConceptIds?: string[];
  rationale?: string;
  relevance?: string;
}

interface AISuggestedResourcesProps {
  goalId?: string;
  goalDescription: string;
  masteryLevel: string;
  concepts?: Array<{ id: string; name: string; status: string }>;
  confusionPatterns?: string[];
}

const ICON: Record<ResourceType, any> = {
  article: FileText, video: Video, documentation: BookOpen, book: Book,
  course: GraduationCap, tool: Wrench, podcast: Headphones, blog: Rss,
  community: Users, github: Github,
};

const COLOR: Record<ResourceType, string> = {
  article: 'text-primary border-primary/30 bg-primary/10',
  video: 'text-streak border-streak/30 bg-streak/10',
  documentation: 'text-highlight border-highlight/30 bg-highlight/10',
  book: 'text-level border-level/30 bg-level/10',
  course: 'text-xp border-xp/30 bg-xp/10',
  tool: 'text-foreground border-border bg-muted/30',
  podcast: 'text-streak border-streak/30 bg-streak/10',
  blog: 'text-primary border-primary/30 bg-primary/10',
  community: 'text-level border-level/30 bg-level/10',
  github: 'text-foreground border-border bg-muted/30',
};

export default function AISuggestedResources({
  goalId,
  goalDescription,
  masteryLevel,
  concepts,
  confusionPatterns,
}: AISuggestedResourcesProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [resources, setResources] = useState<SuggestedResource[]>([]);
  const [meta, setMeta] = useState<{ effectiveLevel?: string; droppedCount?: number; validated?: number; generatedAt?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [savingUrl, setSavingUrl] = useState<string | null>(null);

  // Set of already-saved URLs for quick lookup
  const { data: savedUrls } = useQuery({
    queryKey: ['saved-resources-urls', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_resources').select('url').eq('user_id', user!.id);
      if (error) throw error;
      return new Set((data || []).map(r => r.url));
    },
  });

  // Load any cached suggestions for this goal so they survive refresh/tab switch.
  useQuery({
    queryKey: ['goal-resource-cache', goalId, user?.id],
    enabled: !!user && !!goalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goal_resource_suggestions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('goal_id', goalId!)
        .maybeSingle();
      if (error) throw error;
      if (data?.payload) {
        const list = ((data.payload as any).resources || []) as SuggestedResource[];
        setResources(list);
        setMeta({
          effectiveLevel: data.effective_level || (data.payload as any).effectiveLevel,
          droppedCount: (data.payload as any).droppedCount,
          validated: (data.payload as any).validated,
          generatedAt: data.generated_at,
        });
        setFetched(true);
      }
      return data;
    },
  });

  const run = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-resources', {
        body: {
          goalDescription,
          masteryLevel,
          concepts: concepts || [],
          confusionPatterns: confusionPatterns || [],
        },
      });
      if (error) throw error;

      const list: SuggestedResource[] = (data?.resources || []).map((r: any) => ({
        title: r.title || 'Resource',
        url: r.url || '#',
        type: r.type || 'article',
        description: r.description || '',
        source: r.source,
        free: r.free !== false,
        relatedConcepts: r.relatedConcepts || [],
        relatedConceptIds: r.relatedConceptIds || [],
        rationale: r.rationale,
        relevance: r.relevance,
      }));

      setResources(list);
      setMeta({
        effectiveLevel: data?.effectiveLevel,
        droppedCount: data?.droppedCount,
        validated: data?.validated,
        generatedAt: new Date().toISOString(),
      });
      setFetched(true);

      // Persist cache so future loads/tab switches don't lose suggestions.
      if (goalId) {
        await supabase.from('goal_resource_suggestions').upsert({
          user_id: user.id,
          goal_id: goalId,
          payload: { resources: list, droppedCount: data?.droppedCount, validated: data?.validated, effectiveLevel: data?.effectiveLevel } as any,
          effective_level: data?.effectiveLevel || null,
          generated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,goal_id' });
        qc.invalidateQueries({ queryKey: ['goal-resource-cache', goalId, user.id] });
      }

      if (list.length === 0) toast.info('No reachable resources found — try refreshing.');
      else if (data?.droppedCount > 0) toast.success(`${list.length} live resources (${data.droppedCount} unreachable links filtered out)`);
      else toast.success(`${list.length} live resources found`);
    } catch (err: any) {
      console.error('Error suggesting resources:', err);
      toast.error(err?.message || 'Failed to get resource suggestions');
    } finally {
      setLoading(false);
    }
  };

  const save = async (r: SuggestedResource) => {
    if (!user) return;
    setSavingUrl(r.url);
    try {
      const { error } = await supabase.from('saved_resources').insert({
        user_id: user.id,
        goal_id: goalId || null,
        title: r.title,
        url: r.url,
        type: r.type,
        source: r.source || null,
        description: r.description || null,
        tags: r.relevance ? [r.relevance] : [],
        concept_ids: r.relatedConceptIds || [],
        concept_names: r.relatedConcepts || [],
        rationale: r.rationale || null,
        is_free: r.free !== false,
      });
      if (error) {
        if ((error as any).code === '23505') {
          toast.info('Already in your library');
        } else throw error;
      } else {
        toast.success('Saved to library');
      }
      qc.invalidateQueries({ queryKey: ['saved-resources-urls', user.id] });
      qc.invalidateQueries({ queryKey: ['saved-resources', user.id] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save');
    } finally {
      setSavingUrl(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">AI Resource Suggestions</h3>
              <p className="text-xs text-muted-foreground">
                Free resources picked for your current skill-tree level. Every link is checked for reachability.
              </p>
            </div>
          </div>
          <Button onClick={run} disabled={loading} size="sm" className="gap-2">
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : fetched
                ? <RefreshCw className="h-4 w-4" />
                : <Sparkles className="h-4 w-4" />}
            {loading ? 'Curating…' : fetched ? 'Refresh' : 'Suggest Resources'}
          </Button>
        </div>

        {meta && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {meta.effectiveLevel && (
              <span className="rounded-full border border-border/60 px-2 py-0.5 capitalize">
                Targeting: {meta.effectiveLevel}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5">
              <ShieldCheck className="h-3 w-3 text-xp" />
              {resources.length} reachable
            </span>
            {!!meta.droppedCount && (
              <span className="rounded-full border border-destructive/30 px-2 py-0.5 text-destructive/90">
                {meta.droppedCount} dead links filtered
              </span>
            )}
          </div>
        )}
      </div>

      {resources.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {resources.map((r, i) => {
            const Icon = ICON[r.type as ResourceType] || FileText;
            const saved = savedUrls?.has(r.url);
            return (
              <div key={i} className="group glass-card rounded-xl p-4 transition-all hover:border-primary/40">
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${COLOR[r.type as ResourceType] || COLOR.article}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground group-hover:text-primary line-clamp-2">{r.title}</p>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </a>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className={`capitalize rounded-full border px-1.5 py-0.5 ${COLOR[r.type as ResourceType] || COLOR.article}`}>{r.type}</span>
                      {r.source && <span className="rounded-full bg-muted/40 px-1.5 py-0.5 text-muted-foreground">{r.source}</span>}
                      {r.free !== false && <span className="rounded-full bg-xp/15 px-1.5 py-0.5 text-xp">Free</span>}
                      {r.relevance && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-primary capitalize">{r.relevance}</span>}
                    </div>

                    {(r.relatedConcepts && r.relatedConcepts.length > 0) && (
                      <div className="mt-2 rounded-lg border border-border/50 bg-muted/20 p-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Helps with</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {r.relatedConcepts.map((c, j) => (
                            <span key={j} className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{c}</span>
                          ))}
                        </div>
                        {r.rationale && (
                          <p className="mt-1.5 text-[11px] text-muted-foreground italic">{r.rationale}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex justify-end">
                      <Button
                        variant={saved ? 'secondary' : 'ghost'}
                        size="sm"
                        disabled={!!saved || savingUrl === r.url}
                        onClick={() => save(r)}
                        className="h-7 gap-1 text-xs"
                      >
                        {savingUrl === r.url
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : saved
                            ? <BookmarkCheck className="h-3 w-3" />
                            : <BookmarkPlus className="h-3 w-3" />}
                        {saved ? 'Saved' : 'Save to library'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
