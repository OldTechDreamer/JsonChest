# Json Chest
A simple way to save and load nested objects in JSON.
To use:
1. Include "json_chest.js" in your application
2. Extend all the classes you want to save with JsonChest
3. Use JcAdd() and JcAddSet() functions to sell Json Chest which variables you want to save
4. Use JcSave\*() and JcLoad\*() functions to save and load

# Example
```
class Pony extends JsonChest{
	constructor(pony_name){
		super();
		
		this.pony_name = pony_name;
		this.JcAdd("Name", "pony_name", JsonChest.VAR);
	}
}

let derpy = new Pony("Derpy");

// Save
let saved_pony = Derpy.JcSave();

// Load / copy
let another_pony = new Pony("");
another_pony.JcLoad(saved_pony);
```

See *example.js* and *example.html* (which runs *example.js*) for more details.


# JsonChest functions
### `JcAdd(name, attribute_name, type, object_create_function)`
* name = Name of the item you wish to save / load
* attribute_name = name of the class variable
* type = One of: 
	* JsonChest.VAR = A simple variable 
	* JsonChest.OBJECT = A variable storing an object (must also extend JsonChest)
	* JsonChest.OBJECT_REFERENCE = Like OBJECT, except when this is loaded, Json Chest will look for an existing object stored somewhere else. This is useful when one object is stored in multiple places. Create it in one place, then reference it in the others.
	
	* JsonChest.VAR_LIST = An array storing anything except objects
	* JsonChest.OBJECT_LIST = List of objects
	* JsonChest.OBJECT_REFERENCE_LIST = List of references
* object_create_function = (only required for object types) A function to create a new instance of the object: `function(object_name, object_json_data){ return new ObjectName(); }` This is used when loading, as Json Chest needs to know how to create the object. object_name is equal to "name" given in JcAdd. object_json_data contains the data saved from the object (this may help in identifying what object instance needs to be created, e.g. object_json_data["MyObJectType"] if previously added with JcAdd()). If this is null, it is assumed that the object already exists and a new one will not be created;

### `JcAddSet(name, attribute_name, value, type, object_create_function)`
The same as JcAdd, except "value" will be assigned to the variable.

### `JsRemove(name)`
Remove a variable previously added.

### `JcSave()`
Returns an JSON object with the saved data.

### `JcLoad(json)`
Load the JSON object data.

### `JcSaveAsJson()`
Like JcSave, except a JSON string is returned.

### `JcLoadFromJson(json)`
Like JcLoad, except it takes a JSON string.

### `JcOnLoad()`
This does nothing, but is called from Json Chest after a Load. It can be declared in your class to run something after the class has been loaded. 