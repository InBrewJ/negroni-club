package main

import (
	"fmt"
	"strings"
)

// RelationshipType defines the kind of connection between nodes.
type RelationshipType int

const (
	UnknownRelationship RelationshipType = iota // Default zero value, good for catching uninitialized
	HasIngredient
	ServedWith
	GarnishedWith
	ServedIn
	StoredIn
	MadeOf
	PlacedOn
	HeldIn
	BrandOf
	// Add more relationship types here
)

// String returns a human-readable representation of the RelationshipType.
func (rt RelationshipType) String() string {
	switch rt {
	case HasIngredient:
		return "HAS_INGREDIENT"
	case ServedWith:
		return "SERVED_WITH"
	case GarnishedWith:
		return "GARNISHED_WITH"
	case ServedIn:
		return "SERVED_IN"
	case StoredIn:
		return "STORED_IN"
	case MadeOf:
		return "MADE_OF"
	case PlacedOn:
		return "PLACED_ON"
	case HeldIn:
		return "HELD_IN"
	case BrandOf:
		return "BRAND_OF"
	default:
		return "UNKNOWN_RELATIONSHIP"
	}
}

// Node represents an entity in our knowledge graph.
type Node struct {
	ID   string // Unique identifier for the node
	Name string // Human-readable name
	Type string // Category of the node (e.g., Ingredient, Container, Material)
}

// Edge represents a directed relationship between two nodes.
type Edge struct {
	From         *Node            // The source node
	To           *Node            // The target node
	Relationship RelationshipType // Describes the relationship (e.g., "MADE_OF", "CONTAINS")
}

// Graph holds all nodes and edges.
// We use a map for nodes for easy lookup by ID.
// Gem says this is a 'labeled directed graph'
type Graph struct {
	Nodes map[string]*Node
	Edges []*Edge
}

// NewGraph creates an empty graph.
func NewGraph() *Graph {
	return &Graph{
		Nodes: make(map[string]*Node),
		Edges: []*Edge{},
	}
}

// AddNode adds a new node to the graph.
// It returns the added node or an existing one if the ID is already present.
func (g *Graph) AddNode(id, name, nodeType string) *Node {
	if node, exists := g.Nodes[id]; exists {
		// Optionally, update the node or return an error if IDs must be unique on creation
		fmt.Printf("Node with ID '%s' already exists. Returning existing node.\n", id)
		return node
	}
	node := &Node{ID: id, Name: name, Type: nodeType}
	g.Nodes[id] = node
	return node
}

// AddEdge adds a new relationship (edge) between two nodes.
// It requires the IDs of the 'from' and 'to' nodes.
func (g *Graph) AddEdge(fromID string, toID string, relationship RelationshipType) error {
	fromNode, fromExists := g.Nodes[fromID]
	if !fromExists {
		return fmt.Errorf("error adding edge: source node '%s' not found", fromID)
	}
	toNode, toExists := g.Nodes[toID]
	if !toExists {
		return fmt.Errorf("error adding edge: target node '%s' not found", toID)
	}

	edge := &Edge{
		From:         fromNode,
		To:           toNode,
		Relationship: relationship,
	}
	g.Edges = append(g.Edges, edge)
	return nil
}

// PrintASCII provides a simple textual representation of the graph.
func (g *Graph) PrintASCII() {
	fmt.Println("--- Knowledge Graph ---")

	fmt.Println("\nNodes:")
	if len(g.Nodes) == 0 {
		fmt.Println("  No nodes in the graph.")
	}
	for _, node := range g.Nodes {
		fmt.Printf("  - [%s] %s (%s)\n", node.ID, node.Name, node.Type)
	}

	fmt.Println("\nRelationships (Edges):")
	if len(g.Edges) == 0 {
		fmt.Println("  No edges in the graph.")
	}
	for _, edge := range g.Edges {
		fmt.Printf("  %s (%s) --[%s]--> %s (%s)\n",
			edge.From.Name, edge.From.ID,
			strings.ToUpper(edge.Relationship.String()),
			edge.To.Name, edge.To.ID)
	}

	fmt.Println("\n\n--- Detailed View (Adjacency List Style) ---")
	// For a more structured view, let's build an adjacency list for outgoing and incoming edges
	outgoing := make(map[string][]string)
	incoming := make(map[string][]string)

	for _, edge := range g.Edges {
		outgoing[edge.From.ID] = append(outgoing[edge.From.ID],
			fmt.Sprintf("--[%s]--> %s (%s)", strings.ToUpper(edge.Relationship.String()), edge.To.Name, edge.To.ID))
		incoming[edge.To.ID] = append(incoming[edge.To.ID],
			fmt.Sprintf("<--[%s]-- %s (%s)", strings.ToUpper(edge.Relationship.String()), edge.From.Name, edge.From.ID))
	}

	for id, node := range g.Nodes {
		fmt.Printf("\nNode: %s (%s, Type: %s)\n", node.Name, node.ID, node.Type)
		if rels, ok := outgoing[id]; ok && len(rels) > 0 {
			fmt.Println("  Outgoing Relationships:")
			for _, rel := range rels {
				fmt.Printf("    %s\n", rel)
			}
		} else {
			fmt.Println("  No outgoing relationships.")
		}

		if rels, ok := incoming[id]; ok && len(rels) > 0 {
			fmt.Println("  Incoming Relationships:")
			for _, rel := range rels {
				fmt.Printf("    %s\n", rel)
			}
		} else {
			fmt.Println("  No incoming relationships.")
		}
	}
	fmt.Println("\n--- End of Graph ---")
}

func main() {
	// 1. Create a new graph
	negroniKG := NewGraph()

	// 2. Add Nodes (Entities)
	// Constituent parts of the Negroni
	negroniKG.AddNode("negroni", "Negroni Cocktail", "Cocktail")
	negroniKG.AddNode("gin", "Gin", "Ingredient")
	negroniKG.AddNode("sweet_vermouth", "Sweet Vermouth", "Ingredient")
	negroniKG.AddNode("campari", "Campari", "Ingredient")
	negroniKG.AddNode("ice", "Ice", "Ingredient")              // Or "Garnish"
	negroniKG.AddNode("orange_peel", "Orange Peel", "Garnish") // More specific than "Orange"

	// Brands
	negroniKG.AddNode("silent_pool", "Silent Pool", "Brand")
	negroniKG.AddNode("gordons", "Gordon's Gin", "Brand")
	negroniKG.AddNode("monkey_forty_seven", "Monkey 47", "Brand")
	negroniKG.AddNode("campari_brand", "Campari", "Brand")
	negroniKG.AddNode("martini_rosso", "Martini Rosso", "Brand")

	// Containers and Utensils
	negroniKG.AddNode("bottle", "Bottle", "Container")
	negroniKG.AddNode("drinking_glass", "Drinking Glass", "Utensil") // e.g., Old Fashioned Glass

	// Materials
	negroniKG.AddNode("glass_material", "Glass (Material)", "Material")

	// Environment (as per your list)
	negroniKG.AddNode("table", "Table", "Furniture")
	negroniKG.AddNode("hand", "Adult Human Hand", "Accessories")

	// 3. Add Edges (Relationships)
	// Negroni composition
	negroniKG.AddEdge("negroni", "gin", HasIngredient)
	negroniKG.AddEdge("negroni", "sweet_vermouth", HasIngredient)
	negroniKG.AddEdge("negroni", "campari", HasIngredient)
	negroniKG.AddEdge("negroni", "ice", ServedWith)
	negroniKG.AddEdge("negroni", "orange_peel", GarnishedWith)
	negroniKG.AddEdge("negroni", "drinking_glass", ServedIn)

	// How ingredients are contained
	negroniKG.AddEdge("gin", "bottle", StoredIn)
	negroniKG.AddEdge("sweet_vermouth", "bottle", StoredIn)
	negroniKG.AddEdge("campari", "bottle", StoredIn)

	// Material composition
	negroniKG.AddEdge("bottle", "glass_material", MadeOf)
	negroniKG.AddEdge("drinking_glass", "glass_material", MadeOf)
	negroniKG.AddEdge("table", "glass_material", MadeOf)

	// Placement
	negroniKG.AddEdge("drinking_glass", "table", PlacedOn) // As per your list
	negroniKG.AddEdge("drinking_glass", "hand", HeldIn)

	// Branding
	negroniKG.AddEdge("silent_pool", "gin", BrandOf)
	negroniKG.AddEdge("gordons", "gin", BrandOf)
	negroniKG.AddEdge("monkey_forty_seven", "gin", BrandOf)
	negroniKG.AddEdge("campari_brand", "campari", BrandOf)
	negroniKG.AddEdge("martini_rosso", "sweet_vermouth", BrandOf)

	// 4. Print the graph
	negroniKG.PrintASCII()

	// Regarding your point about a "cycle":
	// Bottle --MADE_OF--> GlassMaterial
	// DrinkingGlass --MADE_OF--> GlassMaterial
	// This means "GlassMaterial" is a common property/component for "Bottle" and "DrinkingGlass".
	// It's not a cycle in the sense of A -> B -> A.
	// A true cycle would be if, for example, GlassMaterial was somehow made from Bottles.
	// Our printout will show these shared connections clearly.
}
