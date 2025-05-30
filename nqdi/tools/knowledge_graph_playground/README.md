# Noodle playground for simple knowledge graphs in Go

## Bootstrap and run

```sh
nx g @nx-go/nx-go:application tools/knowledge_graph_playground
```

```sh
# from root
nx serve knowledge_graph_playground
```

## Graph idea

- Represents the constituent parts of a Negroni:
  - Gin
  - Sweet Vermouth
  - Campari
  - Ice
  - Orange
  - Drinking Glass
  - Table
- Gin, Vermouth and Campari all comes in bottles, bottles are made of glass,
  - Drinking glasses are also made of glass
