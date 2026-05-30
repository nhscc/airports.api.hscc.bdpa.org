# BDPA Airports Public API

The live API used by solutions this NHSCC problem statement.

## Stochastic Flight States

Or: _how are flight gates and statuses changing automatically in the db?_

Flights are generated between 1 and 30 days in advance of their arrival time
(i.e. `arriveAtReceiver`). When a flight is generated, every single state it
will enter into, from being cancelled to being delayed to arriving to boarding,
is also generated using a [Markov process][1] depending on its `type`.
Afterwards, using an [aggregation pipeline][2], one of these states is selected
every time an API request is made. The state that gets selected depends on the
time the request is received. This means flight data isn't actually "changing"
"randomly" (i.e. stochastically) in the database. It only looks that way.

These states, made up of `arriveAtReceiver`, `gate`, `status`, and
`departFromReceiver`, are generated and stored according to the following rules:

All flights start off in a state where their status is <span style="color:
rgb(31, 119, 180)">_scheduled_ (**A**)</span>, meaning they are scheduled to
arrive at their `landingAt` airport (at `arriveAtReceiver` time) coming in from
their `comingFrom` airport (at `departFromSender` time). Once `departFromSender`
time elapses, there's an 80% chance the flight status becomes <span
style="color: rgb(255, 127, 14)">_on time_ (**B**)</span> and a 20% chance the
flight status becomes <span style="color: rgb(44, 160, 44)">_cancelled_
(**C**)</span>. Once a flight is cancelled, it no longer changes states in the
system.

At some point before `arriveAtReceiver` but after `departFromSender`, there is a
20% chance the flight status becomes <span style="color: rgb(214, 39,
40)">_delayed_ (**D**)</span>, pushing `arriveAtReceiver` back by 15 minutes.
Between 15 minutes and 2 hours before `arriveAtReceiver` elapses (but after the
flight is or isn't delayed), the flight's arrival gate is chosen and visible in
the API <span style="color: rgb(148, 103, 189)">(**E**)</span>.

After the flight's arrival gate is chosen, between 5 and 30 minutes before
`arriveAtReceiver`, the flight's status becomes <span style="color: rgb(140, 86,
75)">_landed_ (**F**)</span>. Immediately, there's a 50% chance <span
style="color: rgb(227, 119, 194)">_the gate changes_ (**G**)</span>.

Once `arriveAtReceiver` elapses, the flight's status becomes <span style="color:
rgb(127, 127, 127)">_arrived_ (**H**)</span>. Immediately, there is a 15% chance
<span style="color: rgb(188, 189, 34)">_the gate changes_ (**I**)</span>.

---

If the flight is an **arrival** (`type` is `arrival`), upon the next hour, the
flight's status becomes <span style="color: rgb(23, 190, 207)">_past_
(**J**)</span> and no longer changes states in the system.

![The Markov model describing how flight states update][3]

---

If, on the other hand, the flight is a **departure** (`type` is `departure`),
between 3 and 10 minutes after the flight's status becomes `arrived`, the
flight's status becomes <span style="color: rgb(23, 190, 207)">_boarding_
(**J**)</span>.

Once `departFromReceiver` elapses, the flight's status becomes <span
style="color: rgb(31, 119, 180)">_boarding_ (**K**)</span>. 2 to 5 hours after
that, the flight's status becomes <span style="color: rgb(255, 127, 14)">_past_
(**L**)</span> and no longer changes states in the system.

![The Markov model describing how flight states update][4]

<!--lint ignore no-heading-punctuation-->

### Are Gates and Flight Numbers Unique?

Gates and flight numbers are unique **but only per airport per hour**. Hence,
two or more flights in the same several-hour span might have the same flight
number or land at the same gate at the same airport, but never within the same
hour.

<!--lint ignore no-heading-punctuation-->

### Why Does the API Respond so Slowly?

The API responds slowly for certain queries due to how each flight's stochastic
states are stored. Since they're nested within the rest of the flight data
(under the `stochasticStates` field) and the correct state is selected through
an [aggregation pipeline][2], [the current state of the flight is not
indexable][5]. Not being able to generate indices on the stochastic state fields
slows down searches involving those fields (like `arriveAtReceiver`, `status`,
and `gate`) by an order of magnitude.

The obvious solution is to break the stochastic states out into their own
collection and index them there; however, we decided to leave the stochastic
states nested within each flight document since it made it easy for the judges
to see [how apps behave while waiting several seconds for a response][6].

tl;dr "It's a feature, not a bug!"

[1]: https://en.wikipedia.org/wiki/Markov_chain
[2]: https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline
[3]:
  markov-arrivals.png
  'Stochastic state flight update markov chain for arrivals'
[4]:
  markov-departures.png
  'Stochastic state flight update markov chain for departures'
[5]:
  https://docs.mongodb.com/manual/core/aggregation-pipeline#pipeline-operators-and-indexes
[6]: https://reactjs.org/docs/concurrent-mode-suspense.html
