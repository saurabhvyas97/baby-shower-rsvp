# Baby Shower RSVP

```mermaid
flowchart TB
  classDef surface fill:#e9f7ff,stroke:#68aeda,stroke-width:2px,color:#1f3a4f
  classDef bridge fill:#fff6d9,stroke:#d7a947,stroke-width:2px,color:#4d3a10
  classDef private fill:#edf8ef,stroke:#7dac85,stroke-width:2px,color:#24472c
  classDef host fill:#f7edf8,stroke:#bb8ec4,stroke-width:2px,color:#47224e

  subgraph Invite_Surface["Public invitation surface"]
    direction LR
    Guest["Guest"]
    Site["GitHub Pages\nRSVP Website"]
    RSVP["RSVP Form\nConfirmation UI"]
  end

  subgraph Data_Bridge["Data bridge"]
    direction LR
    Endpoint["Google Apps Script\nWeb Endpoint"]
    Logic["Save RSVP\nRead Summary"]
  end

  subgraph Private_Data["Private planning layer"]
    direction LR
    Sheet[("Google Sheet\nFull RSVP Records")]
    Counts["Aggregate RSVP Counts"]
  end

  subgraph Host_View["Host view"]
    direction LR
    Stats["Stats Page"]
    Host["Prachi & Saurabh"]
  end

  Guest --> Site
  Site --> RSVP
  RSVP ==> Endpoint
  Endpoint --> Logic
  Logic ==> Sheet
  Sheet --> Counts
  Counts ==> Stats
  Sheet -.-> Host
  Stats -.-> Host

  Guest:::surface
  Site:::surface
  RSVP:::surface
  Endpoint:::bridge
  Logic:::bridge
  Sheet:::private
  Counts:::private
  Stats:::host
  Host:::host
```

```text
Public layer: invitation and RSVP experience
Bridge layer: form submission and summary access
Private layer: full RSVP records
Host layer: planning view and aggregate stats
```
