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
