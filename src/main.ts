export default async function () {
    
    const selection = figma.currentPage.selection;

    // Determine the scope of nodes to update
    //let nodesToUpdate: BaseNode[] = [];
    let nodesToUpdate: SceneNode;
    if (selection.length === 1 && (selection[0].type === 'FRAME' || selection[0].type === 'GROUP')) {
      nodesToUpdate = selection[0]; //findAllNodes(selection[0]);
    } else {
      //nodesToUpdate = findAllNodes(figma.currentPage);
      figma.closePlugin("Select a frame or group node to continue");
      return;
    }

    // Main function to initiate the duplication process
    const newX = 0; // Set new X position
    const newY = 0; // Set new Y position
    duplicateNodes(nodesToUpdate, newX, newY);

    nodesToUpdate = figma.currentPage.selection[0];
    console.log(nodesToUpdate.name)
    // Detach instances before processing
    // to ignore error detaching before continue. in get_width: The node (instance sublayer or table cell) with id "I2:3443;120:12941" does not exist?
    detachInstances(nodesToUpdate);

    flipChildrenHorizontally(nodesToUpdate as FrameNode | GroupNode);
    
    let parent : SceneNode = (nodesToUpdate.parent != null ? nodesToUpdate.parent : nodesToUpdate) as SceneNode;
    if('findAll' in parent) {
      parent.findAll(p => p.name === "l_rtl_for_group").forEach((n)=>{
        let parentLne = n.parent;
        n.remove();
        // if(parentLne && 'x' in parentLne) {
        //   console.log('b parent.x ' + parentLne.x + ' name: ' + parentLne.name);
        //   //if(parentLne.x = (parentLne.x - 1 >= 0 ? parentLne.x - 1 : parentLne.x))
        //   parentLne.x = (parentLne.x - 1  >= 0 ? parentLne.x - 1 : parentLne.x);
        //   console.log('a parent.x ' + parentLne.x + ' name: ' + parentLne.name);
        //   //(parentLne as GroupNode).resize(parentLne.width, parentLne.height);
        // }
        /////
      });
    }
    //////
    // let lstFonts: Array<Object> = [];
    // lstFonts.push({ fontName: "", "",  });
    //////
    // Define the font mappings
    //29LT Zarid Sans, Black
    // const fontMappings: FontMapping[] = [
    //   { oldFamily: 'Arial', newFamily: 'Roboto', oldStyle: 'Regular', newStyle: 'Regular' },
    //   { oldFamily: 'Times New Roman', newFamily: 'Roboto', oldStyle: 'Bold', newStyle: 'Bold' },
    //   // Add more mappings as needed
    // ];
    
    const fontMappings: Map<string, FontMapping> = new Map<string, FontMapping>();
    // [
    //   { oldFamily: '29LT Zarid Sans', newFamily: 'Arial', oldStyle: 'Bold', newStyle: 'Regular' },
    //   { oldFamily: '29LT Zarid Sans', newFamily: 'Arial', oldStyle: 'Regular', newStyle: 'Regular' },
    //   { oldFamily: '29LT Zarid Sans', newFamily: 'Arial', oldStyle: 'SemiBold', newStyle: 'Regular' },
    //   { oldFamily: '29LT Zarid Sans', newFamily: 'Arial', oldStyle: 'Medium Slanted', newStyle: 'Regular' }
    //   // Add more mappings as needed
    // ];

    await getAllFonts(figma.currentPage, fontMappings);
    fontMappings.forEach(p=> {
      p.newFamily = "Arial";
      p.newStyle = "Regular";
      console.log('oF ' + p.oldFamily + ' oS ' + p.oldStyle + ' nF ' + p.newFamily + ' nS ' + p.newStyle)
    });

    ////
    // for (const mapping of fontMappings) {
    //   figma.loadFontAsync({ family: mapping.newFamily, style: mapping.newStyle });
    // }
    ////

    // Ensure all fonts are loaded first
    // loadAllFonts(fontMappings)
    // .then(result => {
      changeFontNames(nodesToUpdate, fontMappings)
      .then(result =>{
        figma.closePlugin('Done.');
      });
    // }); 
    ////
    
    // figma.closePlugin();
}

// Detach instances from the nodes array
// function detachInstances(nodes: SceneNode) {
//   debugger;
//   if('children' in nodes) {
//     for (const node of nodes.children) {
//       if (!doesNodeExist(node.id)) {
//             continue;
//           }
//       if (node.type === 'INSTANCE') {
//         node.detachInstance();
//         console.log(node.id + " " + node.name + " has been detached");
//       }
//     }
//   }
// }

function detachInstances(node : SceneNode) {
  if (!doesNodeExist(node.id)) { return; }
  /////
  if (node.type === 'INSTANCE') {
    const detached = node.detachInstance();

    // Process children of the detached node
    if ('children' in detached) {
      detached.children.forEach(child => detachInstances(child));
    }
  } 

  // Process children of non-instance nodes
  if ('children' in node) {
    if (!doesNodeExist(node.id)) { return; }

    node.children.forEach(child => detachInstances(child));
  }
}

function flipChildrenHorizontally(n: FrameNode | GroupNode) {
  let count = 0;

  //////
  function recursive(node : FrameNode | GroupNode) {
    ////
    count++;
    if (!node.parent) { return; }

    if (!doesNodeExist(node.id)) { return; }

    const parent = node.parent as FrameNode | GroupNode;
    if('layoutMode' in node) {
      //check if auto layout then reorder the children nodes and return
      //'NONE' | 'HORIZONTAL' | 'VERTICAL'
      if(node.layoutMode === "HORIZONTAL") {  
        reverseChildren(node);
        //return; 
      }
    }

    if(parent.type === "GROUP") {
      if(!parent.findOne(p=> p.name === "l_rtl_for_group")) {
        // let l = figma.createLine();
        // l.name = "l_rtl_for_group";
        // l.x = parent.x;
        // l.y = parent.y;
        //l.resize(0.01, 0); // minimum width is 0.01
        //parent.insertChild(0, l);

        let l2 = figma.createLine();
        l2.name = "l_rtl_for_group";
        l2.x = parent.x + parent.width - 1;
        l2.y = parent.y;
        l2.resize(1, 0); // minimum width is 0.01
        parent.insertChild(parent.children.length - 1, l2);
        //parent.resize(parent.width + 1, parent.height);
      }
    } 

    if((node as SceneNode).type === "LINE" || (node as SceneNode).type === "VECTOR") {
      //do nothing
    } else 
    if ((node as SceneNode).type === 'TEXT') {
      //console.log((node as TextNode).fontName);
      figma.loadFontAsync(((node as SceneNode) as TextNode).fontName as FontName)
      .then(result => { 
        if(((node as SceneNode) as TextNode).textAlignHorizontal === 'RIGHT') {
          ((node as SceneNode) as TextNode).textAlignHorizontal = 'LEFT';
        } else if(((node as SceneNode) as TextNode).textAlignHorizontal === 'LEFT') {
          ((node as SceneNode) as TextNode).textAlignHorizontal = 'RIGHT';
        } 

      });
    } else {
      if(parent.type === "FRAME" && parent.layoutMode === "NONE") {
        //console.log(parent.type + " id: " + parent.id + " name: " + parent.name + " width: " + parent.width + " cId: " + node.id + " cName: " + node.name + " cX: " + node.x + " cWidth: " + node.width + " nX: " + (parent.width - node.x - node.width));
        node.x = parent.width - node.x - node.width;
      } else if(parent.type === "GROUP" ) {
        //console.log(parent.width + "  "  + parent.id);
        //console.log(parent.type + " id: " + parent.id + " name: " + parent.name + " width: " + parent.width + " cId: " + node.id + " cName: " + node.name + " cX: " + node.x + " cWidth: " + node.width + " nX: " + ((parent.x + parent.width) - (node.x - parent.x) - node.width) );
        node.x = ((parent.x + parent.width) - (node.x - parent.x) - node.width);
      }
    }
    
    ////
    if (!node.children) { return; }
    let children = node.children;
    let length = children.length;    
    //

    for (var i = 0; i < length; i++) {
      recursive(children[i]  as FrameNode | GroupNode);
    }
  }

  recursive(n);
  console.log(count);
}

function doesNodeExist(nodeId: string): boolean {
  const node = figma.getNodeById(nodeId);
  return !!node; // Returns true if node exists, false otherwise
}

function reverseChildren(node : FrameNode | GroupNode) {
  if (node.children && node.children.length > 0) {
    const children = node.children.slice(); // Create a copy of the children array

    for (let i = 0; i <= children.length - 1; i++) {
      console.log(" id " + children[i].id)
      node.insertChild(children.length-1-i,children[i]); // Append each child in reverse order
    }
  }
}

// Recursively find all nodes
function findAllNodes(node: SceneNode): SceneNode[] {
  let nodes: SceneNode[] = [node];
  if ('children' in node) {
    for (const child of node.children) {
      nodes = nodes.concat(findAllNodes(child));
    }
  }
  return nodes;
}

function duplicateNodes(slcdNode: SceneNode, newX: number, newY: number) {
  //let nodes : SceneNode[] = [];
  //nodes = findAllNodes(slcdNode);
  // // Traverse the document to find all nodes
  // function findAllNodesForDup(node: SceneNode) {
  //   nodes.push(node);
  //   if ('children' in node) {
  //     for (const child of node.children) {
  //       findAllNodesForDup(child);
  //     }
  //   }
  // }

  // // Start traversal from the root
  // findAllNodesForDup(slcdNode);

  // // Duplicate each node and place it at the new location
  // nodes.forEach((node, index) => {
  //   if (node.parent) { // Ensure the node can be duplicated
  //     const duplicate = node.clone();
  //     duplicate.name = duplicate.name + "_test";
  //     duplicate.x = newX + (index % 10) * (node.width + 20); // Adjust spacing and row breaks as needed
  //     duplicate.y = newY + Math.floor(index / 10) * (node.height + 20);
  //     figma.currentPage.appendChild(duplicate);
  //     console.log(node.name + ' added')
  //   }
  // });
  let index = 10;
  const node = slcdNode;
  const duplicate = node.clone();
  duplicate.name = duplicate.name + "_test";
  duplicate.x = newX + (index % 10) * (node.width + 20); // Adjust spacing and row breaks as needed
  duplicate.y = newY + Math.floor(index / 10) * (node.height + 20);
  figma.currentPage.appendChild(duplicate);
  console.log(node.name + ' added')

  let nodes: SceneNode[] = [];
  nodes.push(duplicate);
  figma.currentPage.selection = nodes;

  //figma.notify(`Duplicated ${nodes.length} nodes to new location!`);
}

async function changeFontNames(node: BaseNode, fontMappings: Map<string, FontMapping>) {
  if ("children" in node) {
    for (const child of node.children) {
      await changeFontNames(child, fontMappings);
    }
  } else if ("characters" in node && "fontName" in node) {
    if (node.fontName !== figma.mixed) {
      console.log("node: " + node.name)
      console.log(node.fontName)
    } else {
      console.log("node: " + node.name + " font: mixed")
    }
    
    for (const mapping of fontMappings) {
      
      if (node.fontName !== figma.mixed) {
        const fontName = node.fontName as FontName;
        
        if (fontName.family === mapping[1].oldFamily && fontName.style === mapping[1].oldStyle) {

          // await figma.loadFontAsync({ family: mapping.newFamily, style: mapping.newStyle })
          // .then(()=>{
          //console.log('font changed')

          //if(mapping.isLoaded !== true) {
          //console.log('loading arial')   
          await figma.loadFontAsync({ family: mapping[1].newFamily, style: mapping[1].newStyle })
          .then(()=>{
            node.fontName = { family: mapping[1].newFamily, style: mapping[1].newStyle };
            console.log(node.fontName)
          });
            
          //   fontMappings
          //     .filter(p=> p.newFamily === mapping.newFamily && p.newStyle === mapping.newStyle)
          //     .forEach(element => {
          //       element.isLoaded = true;
          //   });
          // }
          // const myFontLoadingFunction = async () => {
          //   await figma.loadFontAsync({ family: "Arial", style: "Regular" });
          // }
          // myFontLoadingFunction()
          // .then(result =>{
          //   console.log('font changed')
          //   node.fontName = { family: "Arial", style: "Regular" };
          //   console.log(node.fontName)
          // });
          //});
        
        }
      }

    }
  }
}

async function loadAllFonts(fontMappings: FontMapping[]) {
  const fontPromises = fontMappings.flatMap(mapping => [
    //figma.loadFontAsync({ family: mapping.oldFamily, style: mapping.oldStyle }),
    figma.loadFontAsync({ family: mapping.newFamily, style: mapping.newStyle })
  ]);
  await Promise.all(fontPromises);
}

async function getAllFonts(node: BaseNode, fonts: Map<string, FontMapping>) {
  if ("children" in node) {
    for (const child of node.children) {
      await getAllFonts(child, fonts);
    }
  } else if ("characters" in node && "fontName" in node) {
    if (node.fontName !== figma.mixed) {
      const fontName = node.fontName as FontName;
      //fonts.add();
      let key = `${fontName.family} ${fontName.style}`;
      if (!fonts.has(key)) {
        fonts.set(key, { oldFamily: fontName.family, oldStyle: fontName.style, newFamily: "", newStyle: "" });
      }
    } 
    // else {
    //   for (let i = 0; i < node.characters.length; i++) {
    //     const fontName = node.getRangeFontName(i, i + 1) as FontName;
    //     fonts.add({ oldFamily: fontName.family, oldStyle: fontName.style, newFamily: "", newStyle: "" });
    //   }
    // }
  }
}

type FontMapping = {
  oldFamily: string;
  newFamily: string;
  oldStyle: string;
  newStyle: string;
};