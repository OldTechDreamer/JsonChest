// Pony class which can be saved with Json Chest:
class Pony extends JsonChest{
	constructor(name){
		super();		// Always call this
		
		// Create this.name with the value name
		this.JcAddSet("Name", "name", name, JsonChest.VAR);
		
		// Create this.items array to store Item objects
		this.JcAddSet("Items", "items", [], JsonChest.OBJECT_LIST, function(name, object_json_data){
			// This is called when Pony is loaded and needs to know what object "Item" is
			return new Item("Unknown item", 0);
		});
		
		// Create this.item_in_hoof (which will be a reference to an object in this.items
		this.JcAddSet("ItemInHoof", "item_in_hoof", null, JsonChest.OBJECT_REFERENCE);
	}
	
	AddItem(item){
		this.items.push(item);
	}
	
	PutItemInHoof(item){
		this.item_in_hoof = item;
	}
	
	PrintInfo(){
		console.log("Hello! My name is " + this.name);
		console.log("I have the following items:");
		
		for (let i = 0; i < this.items.length; i++){
			console.log("\t" + this.items[i].name + " x " + this.items[i].quantity.toString());
		}

		if (this.item_in_hoof == null){
			console.log("I have nothing in my hoof.");
		
		}else{
			console.log("I am holding a " + this.item_in_hoof.name + " in my hoof.");
		}
	}
}

class Item extends JsonChest{
	constructor(name, quantity){
		super();
		
		this.JcAddSet("Name", "name", name, JsonChest.VAR);
		this.JcAddSet("Quantity", "quantity", quantity, JsonChest.VAR);
	}
}

// Create a pony and save it
let twilight = new Pony("Twilight Sparkle");

let to_do_list = new Item("To do list", 1);

twilight.AddItem(new Item("Book", 2));
twilight.AddItem(new Item("Quill", 1));
twilight.AddItem(to_do_list);

twilight.PutItemInHoof(to_do_list);

let twilight_data = twilight.JcSave();

console.log("Twilight's data saved:");
console.log(twilight_data);
console.log("\n");

// Now create an empty pony and load the saved data
let pony = new Pony("A horse with no name");
pony.JcLoad(twilight_data);

pony.PrintInfo();
