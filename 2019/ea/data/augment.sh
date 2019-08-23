jq -s '[ .[0] + .[1] | group_by(.name)[] | select(length > 1) | add ]' $1.json $2.json
