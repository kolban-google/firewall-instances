Within a GCP project we can define firewall rules.  These rules can be associated with compute
engine instances through the use of tags.  In a firewall rule, we can specify a set of one or more
named tags and the rule will be applied only if a tag in the firewall rule matches a tag associated
with a compute engine.  As our project grows, we may end up with lots of firewall rules and we may
find ourselves asking the question "Are there any firewall rules which have no matching
compute engine instances?".  We can manually examine each firewall rule and then look to see if
there are any matching instances but this is laborious and error prone.  In this project we describe
a sample tool that dynamically retrieves the current firewall rules and then automatically searches
for matching compute engine instances that have the corresponding tag.

To run the tool download and then:

```
npm install
node index.js --projectNum [projectNum]
```

where projectNum is the numeric id of a project.  The result is a JSON string of the format:

```
[
  {
    "name": "[FIREWALL_RULE_NAME]",
    "instances": [
       "INSTANCE_NAME",
       ... 
    ]
  },
  ...
]
```

If a firewall rule has no matching instances, the instances field will not be populated.
