package schemas

// This file defines Go structs for all artifact payloads used in
// JSON Schema generation. Where existing Go structs exist in the
// codebase, we use type aliases to avoid duplication (DRY). For
// artifact types that don't have existing Go structs (quality-report,
// review-verdict), we define new structs here. All structs use
// json tags as the source of truth for schema generation via
// invopop/jsonschema.

import (
	"github.com/unbound-force/unbound-force/internal/artifacts"
)

// --- Envelope Schema ---

// EnvelopeSchema represents the artifact envelope for JSON Schema
// generation. Uses typed Context and Payload fields instead of
// json.RawMessage to produce a fully-specified schema (FR-001).
type EnvelopeSchema struct {
	Hero          string        `json:"hero" jsonschema:"description=Producing hero identifier,example=gaze"`
	Version       string        `json:"version" jsonschema:"description=Hero version (semver),example=1.0.0"`
	Timestamp     string        `json:"timestamp" jsonschema:"description=ISO 8601 timestamp,example=2026-03-21T10:00:00Z"`
	ArtifactType  string        `json:"artifact_type" jsonschema:"description=Artifact type identifier,example=quality-report"`
	SchemaVersion string        `json:"schema_version" jsonschema:"description=Schema version (semver),example=1.0.0"`
	Context       ContextSchema `json:"context" jsonschema:"description=Workflow context metadata"`
	Payload       interface{}   `json:"payload" jsonschema:"description=Type-specific payload object"`
}

// ContextSchema represents the context field of the artifact
// envelope. Maps to artifacts.ArtifactContext but with schema
// metadata tags (FR-002, FR-014).
type ContextSchema struct {
	Branch        string `json:"branch,omitempty" jsonschema:"description=Git branch name"`
	Commit        string `json:"commit,omitempty" jsonschema:"description=Git commit SHA"`
	BacklogItemID string `json:"backlog_item_id,omitempty" jsonschema:"description=Originating backlog item ID"`
	CorrelationID string `json:"correlation_id,omitempty" jsonschema:"description=UUID linking related artifacts across workflow stages"`
	WorkflowID    string `json:"workflow_id,omitempty" jsonschema:"description=Workflow instance ID"`
}

// --- Type aliases for existing structs ---

// ArtifactContextPayload aliases the existing artifacts.ArtifactContext.
type ArtifactContextPayload = artifacts.ArtifactContext

// --- New structs for types without existing Go definitions ---

// QualityReportPayload defines the payload for quality-report
// artifacts produced by Gaze. Mirrors the structure in the
// existing sample at schemas/samples/sample-quality-report-envelope.json.
type QualityReportPayload struct {
	Summary         QualityReportSummary    `json:"summary" jsonschema:"description=Overall quality scores"`
	Functions       []FunctionMetric        `json:"functions" jsonschema:"description=Per-function quality metrics"`
	Coverage        CoverageData            `json:"coverage" jsonschema:"description=Aggregate coverage data"`
	Recommendations []QualityRecommendation `json:"recommendations" jsonschema:"description=Improvement recommendations"`
}

// QualityReportSummary provides aggregate quality scores.
type QualityReportSummary struct {
	TotalFunctions int     `json:"total_functions" jsonschema:"description=Total number of analyzed functions"`
	AvgCoverage    float64 `json:"avg_coverage" jsonschema:"description=Average code coverage percentage"`
	AvgCrap        float64 `json:"avg_crap" jsonschema:"description=Average CRAP score"`
	CrapLoad       int     `json:"crap_load" jsonschema:"description=Number of functions with CRAP score above threshold"`
}

// FunctionMetric provides per-function quality data.
type FunctionMetric struct {
	Name             string  `json:"name" jsonschema:"description=Fully qualified function name"`
	CrapScore        float64 `json:"crap_score" jsonschema:"description=CRAP (Change Risk Anti-Patterns) score"`
	Complexity       int     `json:"complexity" jsonschema:"description=Cyclomatic complexity"`
	Coverage         float64 `json:"coverage" jsonschema:"description=Code coverage percentage"`
	ContractCoverage float64 `json:"contract_coverage" jsonschema:"description=Contract-level coverage percentage"`
	Classification   string  `json:"classification" jsonschema:"description=Function classification (contractual or incidental)"`
}

// CoverageData provides aggregate coverage statistics.
type CoverageData struct {
	TotalLines   int     `json:"total_lines" jsonschema:"description=Total lines of code"`
	CoveredLines int     `json:"covered_lines" jsonschema:"description=Lines covered by tests"`
	Percentage   float64 `json:"percentage" jsonschema:"description=Coverage percentage"`
}

// QualityRecommendation is an actionable improvement suggestion.
type QualityRecommendation struct {
	Priority    string `json:"priority" jsonschema:"description=Recommendation priority (high/medium/low)"`
	Description string `json:"description" jsonschema:"description=Human-readable recommendation"`
	Target      string `json:"target" jsonschema:"description=Target function or package"`
}

// ReviewVerdictPayload defines the historical version 1 payload for
// review-verdict artifacts produced by The Divisor.
type ReviewVerdictPayload struct {
	PersonaVerdicts    []PersonaVerdict `json:"persona_verdicts" jsonschema:"description=Individual persona review verdicts"`
	CouncilDecision    string           `json:"council_decision" jsonschema:"description=Overall council decision (APPROVED/CHANGES_REQUESTED/ESCALATED)"`
	IterationCount     int              `json:"iteration_count" jsonschema:"description=Number of review iterations"`
	UnresolvedFindings []ReviewFinding  `json:"unresolved_findings,omitempty" jsonschema:"description=Findings not yet addressed"`
	PRUrl              string           `json:"pr_url" jsonschema:"description=Pull request URL"`
	ConventionPackUsed string           `json:"convention_pack_used" jsonschema:"description=Convention pack ID used for review"`
}

// ReviewVerdictDecision is a canonical version 2 council decision.
type ReviewVerdictDecision = artifacts.ReviewVerdictDecision

const (
	// ReviewVerdictSchemaVersionV1 identifies historical review verdicts.
	ReviewVerdictSchemaVersionV1 = artifacts.ReviewVerdictSchemaVersionV1
	// ReviewVerdictSchemaVersionV2 identifies current review verdicts.
	ReviewVerdictSchemaVersionV2 = artifacts.ReviewVerdictSchemaVersionV2

	// ReviewVerdictApproved permits downstream automated progression.
	ReviewVerdictApproved = artifacts.ReviewVerdictApproved
	// ReviewVerdictChangesRequested blocks progression on review findings.
	ReviewVerdictChangesRequested = artifacts.ReviewVerdictChangesRequested
	// ReviewVerdictEscalated blocks progression pending human resolution.
	ReviewVerdictEscalated = artifacts.ReviewVerdictEscalated
	// ReviewVerdictInconclusive blocks progression when no result was calculated.
	ReviewVerdictInconclusive = artifacts.ReviewVerdictInconclusive
	// ReviewVerdictUnavailable blocks progression when assessment was unavailable.
	ReviewVerdictUnavailable = artifacts.ReviewVerdictUnavailable
)

// ReviewVerdictV2Payload defines the current version 2 review-verdict
// payload. Version 1 remains a separate historical read model.
type ReviewVerdictV2Payload struct {
	PersonaVerdicts    []PersonaVerdict      `json:"persona_verdicts"`
	CouncilDecision    ReviewVerdictDecision `json:"council_decision"`
	IterationCount     int                   `json:"iteration_count"`
	UnresolvedFindings []ReviewFinding       `json:"unresolved_findings,omitempty"`
	PRUrl              string                `json:"pr_url"`
	ConventionPackUsed string                `json:"convention_pack_used"`
}

// PersonaVerdict represents a single reviewer persona's assessment.
type PersonaVerdict struct {
	Persona  string          `json:"persona" jsonschema:"description=Reviewer persona name (guard/architect/adversary/sre/testing)"`
	Verdict  string          `json:"verdict" jsonschema:"description=Persona verdict (APPROVED/CHANGES_REQUESTED)"`
	Findings []ReviewFinding `json:"findings" jsonschema:"description=Specific findings from this persona"`
	Summary  string          `json:"summary" jsonschema:"description=Persona review summary"`
}

// ReviewFinding is a specific issue found during review.
type ReviewFinding struct {
	Severity    string `json:"severity" jsonschema:"description=Finding severity (CRITICAL/HIGH/MEDIUM/LOW)"`
	Category    string `json:"category" jsonschema:"description=Finding category"`
	Description string `json:"description" jsonschema:"description=Detailed finding description"`
	File        string `json:"file,omitempty" jsonschema:"description=Affected file path"`
	Line        int    `json:"line,omitempty" jsonschema:"description=Affected line number"`
}


