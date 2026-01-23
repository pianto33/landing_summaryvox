#!/bin/sh

echo "::group::Outdated Dependencies"
$(npm outdated --json > outdated.json)
OUTDATED_COUNT=$(jq length outdated.json)
echo "Found $OUTDATED_COUNT outdated dependencies"
if [ "$OUTDATED_COUNT" -gt "0" ]; then
  echo "outdated_count=$OUTDATED_COUNT" >> $GITHUB_OUTPUT
  jq -r 'to_entries | .[] | "Package: \(.key) | Current: \(.value.current) | Latest: \(.value.latest)"' outdated.json
else
  echo "All dependencies are up to date!"
  echo "outdated_count=0" >> $GITHUB_OUTPUT
fi
echo "::endgroup::"

echo "::group::Vulnerability Check"
npm audit --json > audit.json
VULN_COUNT=$(jq '.vulnerabilities | length' audit.json 2>/dev/null || echo "0")
echo "Found $VULN_COUNT vulnerabilities"
if [ "$VULN_COUNT" -gt "0" ]; then
  echo "vulnerability_count=$VULN_COUNT" >> $GITHUB_OUTPUT
  jq -r '.vulnerabilities | to_entries[] | .value | "Vulnerability: \(.name) | Severity: \(.severity) | Range: \(.range) "' audit.json
else
  echo "No vulnerabilities found!"
  echo "vulnerability_count=0" >> $GITHUB_OUTPUT
fi
echo "::endgroup::"

rm ./outdated.json
rm ./audit.json
