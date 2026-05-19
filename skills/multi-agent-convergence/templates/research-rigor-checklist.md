# Research Rigor Checklist

Use this checklist when agents verify each other's research work.

## Logic and Reasoning
- [ ] Each conclusion follows from stated evidence
- [ ] No steps in reasoning skip necessary proof
- [ ] Causal claims are supported, not just correlations
- [ ] Counter-arguments are addressed, not ignored

## Measurement and Methodology
- [ ] Baselines are comparable (same config, same denominator, same seeds)
- [ ] Sample size is sufficient for claimed precision
- [ ] Statistical tests are appropriate for the data
- [ ] Variance/spread is reported alongside averages
- [ ] Improvements are measured as paired differences, not absolute changes

## Bias and Fitting
- [ ] Training data and test data are independent (no leakage)
- [ ] Results hold across multiple seeds/configurations
- [ ] Negative results are reported honestly
- [ ] Cherry-picking of favorable results is flagged
- [ ] Over-fitting to specific test cases is checked

## Gaps and Boundaries
- [ ] Scope of claims matches scope of evidence
- [ ] Edge cases are identified and addressed
- [ ] Known limitations are documented
- [ ] Areas NOT covered by analysis are acknowledged

## Assumptions
- [ ] All assumptions are listed explicitly
- [ ] Each assumption is justified
- [ ] Impact of wrong assumptions is assessed
- [ ] User-specified requirements vs agent-assumed gaps are distinguished

## Reproducibility
- [ ] Steps can be repeated by someone else
- [ ] Configuration is documented (seeds, parameters, model versions)
- [ ] Artifacts are versioned and committed
- [ ] Environment dependencies are noted
