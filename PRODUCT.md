# Beast Track — product

Personal gym log for one lifter (the owner), used on an iPhone between sets, often in a dim gym, one hand, sweaty fingers.

## Job
Log every set fast, and at each set show what was lifted last time (in red) plus a weight/reps suggestion based on double progression, so the lifter progressively overloads week after week without thinking.

## Must have
- Exercise library grouped by muscle group; custom exercises.
- Personal routines ("schede"): exercises, number of sets, rep range.
- Session logging: kg and reps per set, previous session numbers next to the inputs in red.
- Suggestion above each exercise table (double progression: ACSM 2–10% load increase when target reps exceeded; NSCA 2-for-2 increments).
- History per session and per exercise.
- Data lives on the phone (Capacitor Preferences / UserDefaults); JSON backup export/import.

## Platform
iOS app built with Capacitor, sideloaded as an unsigned .ipa re-signed with a free Apple ID (7-day validity). Italian UI.

## Mode
Operate. Native iOS conventions: tab bar, large titles, grouped lists, sheets, 44pt targets, system font, dark-first with light support.
