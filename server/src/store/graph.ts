/**
 * Intent Execution Graph.
 *
 * The shape of the graph is the declared plan: intent -> signed plan -> the
 * steps the agent said it would take. Any action the agent attempts that is not
 * in the plan is attached as an off-plan node, which is why the violating node
 * is visually outside the authorized subtree rather than styled differently.
 */
import { getPlan } from '../armoriq/plan.js';
import { db, latestRun } from './state.js';
import type { ExecutionRecord } from '../types.js';

export type GraphNodeState =
  | 'idle'
  | 'running'
  | 'allowed'
  | 'held'
  | 'blocked'
  | 'approved'
  | 'skipped';

export interface GraphNode {
  id: string;
  kind: 'intent' | 'plan' | 'action';
  label: string;
  sublabel?: string;
  tool?: string;
  layer: number;
  column: number;
  state: GraphNodeState;
  authorizationState: string;
  timestamp?: string;
  executionId?: string;
  inPlan: boolean;
  detail?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  state: 'idle' | 'active' | 'traversed' | 'severed';
}

export interface IntentGraph {
  runId: string | null;
  status: string;
  planId: string;
  planVersion: number;
  intent: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface Blueprint {
  id: string;
  tool: string;
  label: string;
  layer: number;
  column: number;
  inPlan: boolean;
  match: (e: ExecutionRecord) => boolean;
}

const INTERNAL_DOMAIN = 'ap.acme-internal.example';

const BLUEPRINT: Blueprint[] = [
  {
    id: 'invoice.read',
    tool: 'invoice.read',
    label: 'invoice.read',
    layer: 2,
    column: 0,
    inPlan: true,
    match: (e) => e.tool === 'invoice.read',
  },
  {
    id: 'vendor.verify',
    tool: 'vendor.verify',
    label: 'vendor.verify',
    layer: 2,
    column: 1,
    inPlan: true,
    match: (e) => e.tool === 'vendor.verify',
  },
  {
    id: 'invoice.extract',
    tool: 'invoice.extract',
    label: 'invoice.extract',
    layer: 3,
    column: 0,
    inPlan: true,
    match: (e) => e.tool === 'invoice.extract',
  },
  {
    id: 'database.update',
    tool: 'database.update',
    label: 'database.update',
    layer: 4,
    column: 0,
    inPlan: true,
    match: (e) => e.tool === 'database.update',
  },
  {
    id: 'external.send.internal',
    tool: 'external.send',
    label: 'external.send',
    layer: 5,
    column: 0,
    inPlan: true,
    match: (e) => e.tool === 'external.send' && String(e.args.to ?? '').endsWith(INTERNAL_DOMAIN),
  },
  {
    id: 'invoice.archive',
    tool: 'invoice.archive',
    label: 'invoice.archive',
    layer: 6,
    column: 0,
    inPlan: true,
    match: (e) => e.tool === 'invoice.archive',
  },
  {
    id: 'external.send.offplan',
    tool: 'external.send',
    label: 'external.send',
    layer: 6,
    column: 1,
    inPlan: false,
    match: (e) => e.tool === 'external.send' && !String(e.args.to ?? '').endsWith(INTERNAL_DOMAIN),
  },
];

const EDGES: [string, string][] = [
  ['intent', 'plan'],
  ['plan', 'invoice.read'],
  ['plan', 'vendor.verify'],
  ['invoice.read', 'invoice.extract'],
  ['invoice.extract', 'database.update'],
  ['vendor.verify', 'database.update'],
  ['database.update', 'external.send.internal'],
  ['external.send.internal', 'invoice.archive'],
  ['external.send.internal', 'external.send.offplan'],
];

function stateOf(execution: ExecutionRecord | undefined): GraphNodeState {
  if (!execution) return 'idle';
  if (execution.decision === 'BLOCKED') return 'blocked';
  if (execution.decision === 'HELD') return execution.result === 'SUCCESS' ? 'approved' : 'held';
  if (execution.result === 'PENDING') return 'running';
  return 'allowed';
}

function authorizationLabel(execution: ExecutionRecord | undefined, inPlan: boolean): string {
  if (!execution) return inPlan ? 'AUTHORIZED IN PLAN' : 'NOT IN PLAN';
  if (execution.decision === 'ALLOWED') return 'AUTHORIZED';
  if (execution.decision === 'BLOCKED') return 'BLOCKED BEFORE EXECUTION';
  return execution.result === 'SUCCESS' ? 'APPROVED ONCE' : 'OUT OF SCOPE';
}

export function buildGraph(): IntentGraph {
  const run = latestRun();
  const planId = run?.planId ?? db.agents[0]?.planId ?? 'PLN-92A7';
  const plan = getPlan(planId);
  const executions = run
    ? db.executions.filter((e) => e.runId === run.runId)
    : [];

  const nodes: GraphNode[] = [
    {
      id: 'intent',
      kind: 'intent',
      label: 'USER INTENT',
      sublabel: 'Declared operating scope',
      layer: 0,
      column: 0,
      state: run ? 'allowed' : 'idle',
      authorizationState: 'DECLARED',
      inPlan: true,
      detail: plan?.document.intent,
    },
    {
      id: 'plan',
      kind: 'plan',
      label: 'SIGNED PLAN',
      sublabel: `${planId} v${plan?.document.version ?? 1}`,
      layer: 1,
      column: 0,
      state: run ? 'allowed' : 'idle',
      authorizationState: plan ? 'SIGNATURE VERIFIED' : 'NOT CAPTURED',
      inPlan: true,
      detail: `${plan?.document.grants.length ?? 0} grants - ${plan?.algorithm ?? ''}`,
    },
  ];

  for (const blueprint of BLUEPRINT) {
    const execution = executions.find(blueprint.match);
    nodes.push({
      id: blueprint.id,
      kind: 'action',
      label: blueprint.label,
      sublabel: execution ? execution.resource : undefined,
      tool: blueprint.tool,
      layer: blueprint.layer,
      column: blueprint.column,
      state: stateOf(execution),
      authorizationState: authorizationLabel(execution, blueprint.inPlan),
      timestamp: execution?.startedAt,
      executionId: execution?.id,
      inPlan: blueprint.inPlan,
      detail: execution?.authorization.reason,
    });
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edges: GraphEdge[] = EDGES.map(([from, to]) => {
    const target = nodeById.get(to);
    const source = nodeById.get(from);
    let state: GraphEdge['state'] = 'idle';
    if (target && source && source.state !== 'idle') {
      if (target.state === 'idle') state = 'idle';
      else if (target.state === 'held' || target.state === 'blocked') state = 'severed';
      else if (target.state === 'running') state = 'active';
      else state = 'traversed';
    }
    return { from, to, state };
  });

  return {
    runId: run?.runId ?? null,
    status: run?.status ?? 'idle',
    planId,
    planVersion: plan?.document.version ?? 1,
    intent: plan?.document.intent ?? '',
    nodes,
    edges,
  };
}
