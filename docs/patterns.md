


Allowed patterns & meta-patterns for PatternsService:

* `{existing patternname}`
    * e.g. `policecar`
* `#hexcolor`
    * e.g. `#ff0033`
* `~off`
* `~blink:{color}-{count}`
    * e.g. `~blink:red-3`  (can be CSS color name)
    * e.g. `~blink:#ff00ff-5`
* `~blink:{color}-{count}-{on/off time}`
    * e.g. `~blink:white-3-0.2`
* `~pattern:{name}:{patternstring}`
    * e.g. `~pattern:bob:3,#ff00ff,0.5,0,#00ff00,1.3,0`
    * e.g. `~pattern:good to go:1,#00f300,0.5,0,#000000,0.5,0`
* `~pattern-stop:{patternname}`
    * e.g. `~pattern-stop:policecar`
