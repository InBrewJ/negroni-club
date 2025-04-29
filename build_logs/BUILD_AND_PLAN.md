# 2025-04-14 (Go 1.23.3)

## Plan

- On the app, craft a simple form on `/screens/contribute` that will create a new NQDI instance
- It doesn't have to have a location, but it should have a country
- If it's vaguely simple, ask the browser for precise location and plug in the lon / lat values

## Solutions and Problems

- https://go.dev/doc/tutorial/web-service-gin#add_item
- https://tanstack.com/form/latest/docs/overview
- https://tanstack.com/form/latest/docs/framework/react/guides/react-native

### Confusion with the types of fields in @tanstack/react-form

- All numeric fields (Bite etc) were being transferred over the wire as strings,
  surely there's a way to convert the string to a number before handing off to the submit hander?

# 2025-14-16 ~21:38 UTC

On this day, negroni.club stopped working, presumably because of this warning on the Vultr console:

```txt
 Frankfurt Scheduled Maintenance - 2025-04-16
ALRT-2PTVY6Z
Event Type: Network Upgrade

We are performing system changes in the Frankfurt location during the following scheduled maintenance window.

Start Time: 2025-04-16 23:00:00 UTC
End Time: 2025-04-17 03:00:00 UTC

We schedule higher impact maintenance events during off-peak times to maintain our ideal hosting environment. Our engineers make every effort to minimize system impact; however, Frankfurt instances may be unreachable for some, or all, of the scheduled maintenance window as we perform network, firmware, or host upgrades.
```

The experience on the negroni.club website was that ping did NOT pong, requests to gin.negroni.com took 40s and then crapped out.

Note that this is happening OUTSIDE of the reported maintenance window. HM.

This isn't the greatest experience during low cost initial development. Is this a good region to seriously consider switching to Digital Ocean, even with the extra cost?

The way around it is with a multi region / az deployment ofc. I don't know if Vultr supports this

Do some research on single region outages / maintenance windows on Digital Ocean.

Or, finally, does lambda win again? One lambda per REST route? One massive lambdalith?

# NEXT

- Make the contribute form better, add in a field for name of establishment, allow a restrained word limit review (five words or less)
- Work out some minimal form validation + display HTTP error messages if the form isn't filled in correctly
- Hook up the existing code in location.tsx with the contribute form

OR

- Write CDKTF stuff for the Vultr deployment
- Create a working, repeatable deployment pipeline (using GitHub actions)
- Write some smoke tests
- Write real unit tests for the REST API

# 2025-04-28 21:38 UTC

## Plan

Contrary to the NEXT::OR items listen above, I've decided to move away from Vultr. Mainly because:

- Yes, they're cheaper that Digital Ocean and more 'cloud native' than Ionos but they had a random outage in Frankfurt that
  that led to downtime for negroni.club. I suppose this is acceptable, but their container registry interface didn't show
  individual repos
- They accept bitcoin as payment. Fine, maybe I'm a not down with the krypto kids kinda guy, but it made me uneasy
- On balance, for the early stages of Occasio at least, maybe it is better to lean on something like AWS Beanstalk or
  Digital Ocean App Platform, for speed if nothing else
- The noVNC interface to Vultr compute is nice but it also made me feel a little bit queasy

SO, today the plan is to get 'Gin' (the NQDI backend) up and running on Digital Ocean's app platform. No need to worry about
load balancers, there's a scaling option, load balancer built in. The catch: it costs $25 for an egress IP. Which sort of puts it
in the same cost bracket as AWS with the $35 NAT gateway standing charge. Ah well.

If there's time to figure out some cdktf for the infra, that'd be cool. But don't sweat it if not. ClickOps will always be good enough
for the first try.

Other choices made today, after a burst of sanity:

- cdktf is likely the wrong choice. The docs on Github I've perused are kinda towers of text
- to enable multi cloud support, maybe it's best to stick with Terraform. What is the licensing issue here? Must read up
- And, for the moment and for the sake of choosing boring, frugal, predictable tools, let's go with Digital Ocean
- Terraform will allow us to migrate and spin up different infra on a different cloud provider anyway. It also enables something like a
  'frugal' switch. If we're spending too much money, flip the switch and we revert to a barebones but still working setup.
  That'd be cool.
- https://www.hashicorp.com/en/pricing?tab=terraform (free for < 500 resources?)
- https://www.terraform-best-practices.com/
- https://www.digitalocean.com/products/app-platform

## Solutions and Problems

Mainly, ClickOps to create a container registry on Digital Ocean, push up the image

Infra needed in Terraform:

- Container registry (credentials as output? Is this in a separate workspace? (I think so))
- App Platform with egress IP (output)

NOTE that DO charges $5 a month for max 5GB storage. This may be more expensive than Vultr and AWS (almost certainly?)
And again, remember the $25 a month charge for the egress IPs (hopefully there isn't one egress IP for each autoscale node? Hopefully?)

For for autoscaling, we have:

$5 (container registry)

- (
  $25 (for egress IP)
  $29 (for smallest compute where autoscaling works)
  ){PER NODE = $54}

So that comes to $54.00 - $83.00 pcm (which is very clear on the Digital Ocean pricing)

so, with container registry that's up tp $59 - $88 per month.

If we can get free credits, cool. If not we can run a single droplet with nginx or a few droplets in front of a DO managed load balancer
at a slightly more expensive cost than Vultr.

The options, they exist.

But does App Platform pay for itself in terms of autoscaling goodness? In the same fashion as CockroachDB?

On App platform it's also worth noting that log exploration etc isn't great - the in built log viewer seems
to only save the last 5 minutes. It also actively encourages you to forward logs to Datadog etc and also DO's own
'Managed OpenSearch'. Damn and blast. AWS wins here too (with CloudWatch and Log Insights).

Extra nugget of learning - it turns out that if DNS is handled by Cloudflare and proxy is turned on, domain's added to
DO App Platform may not be recognised properly. Once the 'status' of the custom domain on Digital Ocean is 'Active', maybe one
can revert to enabling the Cloudflare proxy?

We'll see, I suppose.
(yep, after reverting the proxy settings, https://campari.negroni.club/ping still works fine and shows as 'active' on the
Digital Ocean App Platform console)
# NEXT (live edit)
Have a look at log forwarding to https://betterstack.com from App Platform, pricing seems attractive

