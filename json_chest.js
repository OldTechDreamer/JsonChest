// Json Chest
// By Nicholas Wright
//
// A simple way to save and load nested objects in JSON.
// Please see README.md for documentation and examples

class JsonChest{
	static VAR = 0x01;
	static OBJECT = 0x02;
	static OBJECT_REFERENCE = 0x04;
	
	static VAR_LIST = 0x10;
	static OBJECT_LIST = 0x20;
	static OBJECT_REFERENCE_LIST = 0x40;
	
	constructor(){
		this.jc_vars = [];		// A list of variable objects
		this.jc_id = -1;		// Unique identifier for JC
		this.jc_id_count = 0;	// ID count for the master which assigns IDs to every object
		
		// Add JC ID for references
		this.JcAdd("JCID", "jc_id", JsonChest.VAR);
	}
	
	JcAdd(name, attribute_name, type, object_create_function){
		let jc_var = new JsonChestVar(this, name, attribute_name, type, object_create_function);
		this.jc_vars.push(jc_var);
	}
	
	JcAddSet(name, attribute_name, value, type, object_create_function){
		this[attribute_name] = value;
		this.JcAdd(name, attribute_name, type, object_create_function);
	}
	
	JsRemove(name){
		let new_jc_vars = [];
		
		for (let v = 0; v < this.jc_vars.length; v++){
			if (this.jc_vars[v].name != name){
				new_jc_vars.push(this.jc_vars[v]);
			}
		}
		
		this.jc_vars = new_jc_vars;
	}
	
	JcSave(){
		// First assign IDs so references will work
		this.JcAssignIDs();
		
		// Save all with this as the master
		return this.JcSaveSlave(this);
	}
	
	JcSaveAsJson(){
		return JSON.stringify(this.JcSave());
	}
	
	JcSaveSlave(master){
		let data = {};
		
		for (let v = 0; v < this.jc_vars.length; v++){
			this.jc_vars[v].Save(data, master);
		}
		
		return data;
	}
	
	JcLoad(data){
		// First load the data (which includes IDs for reference
		this.JcLoadSlave(data, this);
		
		// Then link the references separately
		this.JcLoadSlaveReferences(data, this);
		
		// Finally trigger JcOnLoad()
		this.JcTriggerOnLoad();
	}
	
	JcLoadFromJson(json){
		this.JcLoad(JSON.parse(json));
	}
	
	JcLoadSlave(data, master){
		for (let v = 0; v < this.jc_vars.length; v++){
			this.jc_vars[v].Load(data, master);
		}
	}
	
	JcLoadSlaveReferences(data, master){
		for (let v = 0; v < this.jc_vars.length; v++){
			this.jc_vars[v].LoadReferences(data, master);
		}
	}
		
	JcTriggerOnLoad(){
		this.JcOnLoad();
		
		for (let v = 0; v < this.jc_vars.length; v++){
			this.jc_vars[v].TriggerOnLoad();
		}
	}
	
	// Assign unique IDs to every JC object (so object references can be saved and loaded)
	JcAssignIDs(){
		this.jc_id_count = 0;
		this.JcAssignID(this);
	}
	
	JcAssignID(master){
		// Set ID for this
		this.jc_id = master.JcGenerateID();
		
		// Get ID for any children
		for (let v = 0; v < this.jc_vars.length; v++){
			this.jc_vars[v].AssignClientIDs(master);
		}
	}
	
	JcGenerateID(){
		let new_id = this.jc_id_count;
		this.jc_id_count += 1;
		
		return new_id;
	}
	
	JcGetObjectByID(id){
		// Check this object
		if (id == this.jc_id){
			return this;
		}
		
		// Search the others
		let object = null;
		
		for (let v = 0; v < this.jc_vars.length; v++){
			object = this.jc_vars[v].GetObjectByID(id);
			
			if (object != null){
				return object;
			}
		}
		
		return null;
	}
	
	JcLog(text){
		console.log("[JC] + " + text);
	}
	
	JcOnLoad(){
		// This is called after the object has been loaded
	}
}

class JsonChestVar{
	constructor(jc, name, attribute, type, object_create){
		this.jc = jc;
		this.name = name;
		this.attribute = attribute;
		this.type = type;
		this.object_create = object_create;
	}
	
	Save(data, master){
		switch(this.type){
			case JsonChest.VAR: 
			case JsonChest.VAR_LIST:
				return this.SaveVar(data);
			
			case JsonChest.OBJECT:	return this.SaveObject(data, master);
			case JsonChest.OBJECT_LIST: return this.SaveObjectList(data, master);
			
			case JsonChest.OBJECT_REFERENCE: return this.SaveObjectReference(data, master);
			case JsonChest.OBJECT_REFERENCE_LIST: return this.SaveObjectReferenceList(data, master);
			
			default: this.Log("Error: Invalid type " + this.type);
		}
		
		return false;
	}
	
	Load(data, master){
		switch(this.type){
			case JsonChest.VAR: 
			case JsonChest.VAR_LIST:
				return this.LoadVar(data);
			
			case JsonChest.OBJECT:	return this.LoadObject(data, master);
			case JsonChest.OBJECT_LIST: return this.LoadObjectList(data, master);
			
			case JsonChest.OBJECT_REFERENCE:
			case JsonChest.OBJECT_REFERENCE_LIST:
				return true;
			
			default: this.Log("Error: Invalid type " + this.type);
		}
		
		return false;
	}
	
	LoadReferences(data, master){
		// Reference own vars
		if (this.type == JsonChest.OBJECT_REFERENCE){
			return this.LoadObjectReference(data, master);
			
		}else if(this.type == JsonChest.OBJECT_REFERENCE_LIST){
			return this.LoadObjectReferenceList(data, master);
			
		// Reference children's vars
		}else if(this.type == JsonChest.OBJECT){
			return this.jc[this.attribute].JcLoadSlaveReferences(data[this.name], master);
			
		}else if(this.type == JsonChest.OBJECT_LIST){
			for (let o = 0; o < this.jc[this.attribute].length; o++){
				this.jc[this.attribute][o].JcLoadSlaveReferences(data[this.name][o], master);
			}
			
			return true;
		}
		
		return true;
	}
	
	/* -------- SAVE / LOAD FUNCTIONS -------- */
	
	SaveVar(data){
		try{
			data[this.name] = this.jc[this.attribute];
			
		}catch(error){
			this.Log("Error: Failed to save attribute.");
			return false;
		}
		
		return true;
	}
	
	LoadVar(data){
		try{
			this.jc[this.attribute] = data[this.name];
			
		}catch(error){
			this.Log("Error: Failed to load attribute.");
			return false;
		}
		
		return true;
	}
	
	
	SaveObject(data, master){
		try{
			data[this.name] = this.jc[this.attribute].JcSaveSlave(master);
			
		}catch(error){
			this.Log("Error: Failed to save object. (" + error + ")");
			return false;
		}

		return true;
	}
	
	LoadObject(data, master){
		// Create the object
		let new_object;
		
		// Assume the object already exists
		if (this.object_create == null){
			new_object = this.jc[this.attribute];
			
		}else{
			// Create new object
			try{
				new_object = this.object_create(this.name, data[this.name]);
				
			}catch(error){
				this.Log("Error: Failed to create new object. (" + error + ")");
				return false;
			}
		}
		
		// Load it
		new_object.JcLoadSlave(data[this.name], master);
		
		// Assign
		this.jc[this.attribute] = new_object;
		
		return true;
	}
	
	SaveObjectList(data, master){
		let errors = false;
		
		// Create list for saved objects
		data[this.name] = [];
		
		for (let o = 0; o < this.jc[this.attribute].length; o++){
			let object_to_save = this.jc[this.attribute][o];
			let saved_data = null;
			
			try{
				saved_data = object_to_save.JcSaveSlave(master);
				
			}catch(error){
				this.Log("Error: Failed to save object. (" + error + ")");
				errors = true;
			}
			
			data[this.name].push(saved_data);
		}

		return errors;
	}
	
	LoadObjectList(data, master){
		let errors = false;
		
		// Assume the objects already exists
		if (this.object_create == null){
			for (let o = 0; o < this.jc[this.attribute].length; o++){
				this.jc[this.attribute][o].JcLoadSlave(data[this.name][o], master);
			}
			
		}else{
			// Create empty object list
			this.jc[this.attribute] = [];
			
			for (let o = 0; o < data[this.name].length; o++){
				// Create the object
				let new_object;
				
				try{
					new_object = this.object_create(this.name, data[this.name][o]);
					
				}catch(error){
					this.Log("Error: Failed to create new object. (" + error + ")");
					errors = true;
				}
				
				// Load it
				new_object.JcLoadSlave(data[this.name][o], master);
				
				// Assign
				this.jc[this.attribute].push(new_object);
			}
		}
		
		return errors;
	}
	
	SaveObjectReference(data, master){
		data[this.name] = this.jc[this.attribute].jc_id;
	}
	
	LoadObjectReference(data, master){
		let object = master.JcGetObjectByID(data[this.name]);
		this.jc[this.attribute] = object;
		
		if (object == null){
			this.Log("Error: Unable to find reference to object with JC ID: " + data[this.name].toString());
		}
	}
	
	SaveObjectReferenceList(data, master){
		data[this.name] = [];
		
		for (let r = 0; r < this.jc[this.attribute].length; r++){
			data[this.name].push(this.jc[this.attribute][r].jc_id);
		}
	}
	
	LoadObjectReferenceList(data, master){
		this.jc[this.attribute] = [];
		
		for (let o = 0; o < data[this.name].length; o++){
			let object = master.JcGetObjectByID(data[this.name][o]);
			this.jc[this.attribute].push(object);
			
			if (object == null){
				this.Log("Error: Unable to find reference to object with JC ID: " + data[this.name].toString());
			}
		}
	}
	
	AssignClientIDs(master){
		// Only assign IDs if this value is an object or object list
		
		if (this.type == JsonChest.OBJECT){
			this.jc[this.attribute].JcAssignID(master);
		}
		
		if (this.type == JsonChest.OBJECT_LIST){
			for (let o = 0; o < this.jc[this.attribute].length; o++){
				this.jc[this.attribute][o].JcAssignID(master);
			}
		}
	}
	
	GetObjectByID(id){
		if (this.type == JsonChest.OBJECT){
			return this.jc[this.attribute].JcGetObjectByID(id);
		}
		
		if (this.type == JsonChest.OBJECT_LIST){
			let object = null;
			
			for (let o = 0; o < this.jc[this.attribute].length; o++){
				object = this.jc[this.attribute][o].JcGetObjectByID(id);
				
				if (object != null){
					return object;
				}
			}
		}
		
		return null;
	}
	
	TriggerOnLoad(){
		if (this.type == JsonChest.OBJECT){
			return this.jc[this.attribute].JcTriggerOnLoad();
		}
		
		if (this.type == JsonChest.OBJECT_LIST){
			for (let o = 0; o < this.jc[this.attribute].length; o++){
				return this.jc[this.attribute][o].JcTriggerOnLoad();
			}
		}
	}
	
	Log(text){
		this.jc.JcLog("[" + this.jc.constructor.name + "." + this.attribute + " (" + this.name + ")] " + text);
	}
}