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

# NEXT

- Make the contribute form better, add in a field for name of establishment, allow a restrained word limit review (five words or less)
- Work out some minimal form validation + display HTTP error messages if the form isn't filled in correctly
- Hook up the existing code in location.tsx with the contribute form

OR

- Write CDKTF stuff for the Vultr deployment
- Create a working, repeatable deployment pipeline (using GitHub actions)
- Write some smoke tests
- Write real unit tests for the REST API
