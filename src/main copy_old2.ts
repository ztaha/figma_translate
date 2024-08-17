import { smartSortNodes } from './smart-sort-nodes/utilities/smart-sort-nodes.js'

export default function () {
    
    const selection = figma.currentPage.selection;

    // Determine the scope of nodes to update
    let nodesToUpdate: BaseNode[] = [];
    if (selection.length === 1 && (selection[0].type === 'FRAME' || selection[0].type === 'GROUP')) {
      nodesToUpdate = findAllNodes(selection[0]);
    } else {
      //nodesToUpdate = findAllNodes(figma.currentPage);
      figma.closePlugin("Select a node to continue");
      return;
    }

    // Detach instances before processing
    // to ignore error detaching before continue. in get_width: The node (instance sublayer or table cell) with id "I2:3443;120:12941" does not exist?
    detachInstances(nodesToUpdate);
    //figma.closePlugin();
    //return;
    // Update the alignment of each node
    // for (const node of nodesToUpdate) {
    //   if (!doesNodeExist(node.id)) {
    //     continue;
    //   }
      
    //   if (node.type === 'TEXT') {
    //     //console.log((node as TextNode).fontName);
    //     figma.loadFontAsync((node as TextNode).fontName as FontName)
    //     .then(()=> { (node as TextNode).textAlignHorizontal = 'RIGHT'; });
        
    //     //(node as TextNode).textAlignHorizontal = 'RIGHT';
    //   } else if (node.type === 'FRAME' || node.type === 'GROUP') {

    //     processedNodes = [];
    //     // Adjust alignment properties of frames and groups if needed
    //     // For example, you might flip the children horizontally]
    //     //flipChildrenHorizontally(node as FrameNode | GroupNode);
    //   }

    // }

    flipChildrenHorizontally(selection[0] as FrameNode | GroupNode);
    
    let parent = (selection[0].parent != null ? selection[0].parent : selection[0]);
    parent.findAll(p => p.name === "l_rtl_for_group").forEach((n)=>{
      n.remove();
    });

    figma.closePlugin();
}

// Detach instances from the nodes array
function detachInstances(nodes: BaseNode[]) {
  for (const node of nodes) {
    if (!doesNodeExist(node.id)) {
          continue;
        }
    if (node.type === 'INSTANCE') {
      node.detachInstance();
    }
  }
}

// Function to flip children of a frame or group horizontally
// function flipChildrenHorizontally(node: FrameNode | GroupNode) {
//   if (!node.parent) {
//     return; // Skip root node (no parent)
//   }
//   const parentWidth = (node.parent as FrameNode | GroupNode).width;

//   node.x = parentWidth - node.x - node.width;
//   console.log("node name: " + node.name + " node width: " + node.width + " child name: " + node.name + " node x: " + node.x);
    
//   // Recursively flip children of non-instance nodes
//   if (node as FrameNode | GroupNode) {
//     const children = node.children;
//     if (children) {
//       for (const child of children) {
//         flipChildrenHorizontally(child as FrameNode | GroupNode);
//       }
//     }
//   }
// }
function flipChildrenHorizontally(n: FrameNode | GroupNode) {
  console.log('Fast recursion') 
  let count = 0;
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
      if(!parent.findChild(p=> p.name === "l_rtl_for_group")) {
        let l = figma.createLine();
        l.name = "l_rtl_for_group";
        l.x = parent.x;
        l.y = parent.y;
        l.resize(0.01, 0); // minimum width is 0.01
        parent.insertChild(0, l);

        let l2 = figma.createLine();
        l2.name = "l_rtl_for_group";
        l2.x = parent.x + parent.width;
        l2.y = parent.y;
        l2.resize(0.01, 0); // minimum width is 0.01
        parent.insertChild(parent.children.length - 1, l2);
      }
    } 

    if((node as SceneNode).type === "LINE" || (node as SceneNode).type === "VECTOR") {
      //do nothing
    } else 
    if ((node as SceneNode).type === 'TEXT') {
      //console.log((node as TextNode).fontName);
      figma.loadFontAsync(((node as SceneNode) as TextNode).fontName as FontName)
      .then(()=> { ((node as SceneNode) as TextNode).textAlignHorizontal = 'RIGHT'; });
    } else {
      if(parent.type === "FRAME" && parent.layoutMode === "NONE") {
        console.log(parent.type + " id: " + parent.id + " name: " + parent.name + " width: " + parent.width + " cId: " + node.id + " cName: " + node.name + " cX: " + node.x + " cWidth: " + node.width + " nX: " + (parent.width - node.x - node.width));
        node.x = parent.width - node.x - node.width;
      } else if(parent.type === "GROUP" ) {
        console.log(parent.width + "  "  + parent.id);
        console.log(parent.type + " id: " + parent.id + " name: " + parent.name + " width: " + parent.width + " cId: " + node.id + " cName: " + node.name + " cX: " + node.x + " cWidth: " + node.width + " nX: " + ((parent.x + parent.width) - (node.x - parent.x) - node.width) );
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


let processedNodes: String[] = []; //SceneNode[] = [];

function flipChildrenHorizontally2(node: FrameNode | GroupNode) {
  
  //const parentWidth = node.width;
  if(!node.parent) { return; }
  // Add a flag to track processed nodes
  //if (processedNodes.indexOf(node.id) !== -1) { return; }
  console.log('l: ' + processedNodes.length)
  for (const processedNode of processedNodes) { 
    console.log(processedNode + " id " + node.id + " " + (processedNode === node.id))
    if (processedNode === node.id) {
      
      return; // Node already processed, skip to avoid double processing
    }
  }

  processedNodes.push(node.id);
  const parent = node.parent as FrameNode | GroupNode;
  // if('layoutMode' in parent) {
  //   //check if auto layout then reorder the children nodes and return
  //   if(parent.layoutMode !== "NONE") {  
  //     reverseChildren(parent);
  //     return; 
  //   }
  // }
  console.log("id: " + parent.id + " name: " + parent.name + " width: " + parent.width + " cId: " + node.id + " cName: " + node.name + " cX: " + node.x + " cWidth: " + node.width + " nX: " + (parent.width - node.x - node.width));
  node.x = parent.width - node.x - node.width;
  
  for (const child of node.children) {
    // Recursively flip children of non-instance nodes
    if ('children' in child) {
      flipChildrenHorizontally2(child as FrameNode | GroupNode);
    }

    // const parent = node;
    // console.log("id: " + parent.id + " name: " + parent.name + " width: " + parent.width + " cName: " + child.name + " cX: " + child.x + " cWidth: " + child.width + " nX: " + (parent.width - child.x - child.width));
    // child.x = parent.width - child.x - child.width;
    
  } 
}

// function flipChildrenHorizontally(node: FrameNode | GroupNode) {
//   const parentWidth = node.width;
  
//   for (const child of node.children) {
//     console.log("node name: " + node.name + " node width: " + node.width + " child name: " + child.name + " node x: " + child.x);
//     child.x = parentWidth - child.x - child.width;
//     // Recursively flip children of non-instance nodes
//     if ('children' in child) {
//       flipChildrenHorizontally(child as FrameNode | GroupNode);
//     }
//   } 
// }

function doesNodeExist(nodeId: string): boolean {
  const node = figma.getNodeById(nodeId);
  return !!node; // Returns true if node exists, false otherwise
}

function reverseChildren(node : FrameNode | GroupNode) {
  if (node.children && node.children.length > 0) {
    const children = node.children.slice(); // Create a copy of the children array
    // for (let i = children.length - 1; i >= 0; i--) {
    //   node.appendChild(children[i]); // Append each child in reverse order
    // }
    for (let i = 0; i <= children.length - 1; i++) {
      console.log(" id " + children[i].id)
      node.insertChild(children.length-1-i,children[i]); // Append each child in reverse order
    }
  }
}


function getLayerNames(node: BaseNode): string[] {
  const names: string[] = [];
  if ("children" in node) {
    for (const child of node.children) {
      //console.log(child.name);
      
      names.push(child.name);
      names.push(...getLayerNames(child));
    }
  }
  return names;
}

// Recursively find all nodes
function findAllNodes(node: BaseNode): BaseNode[] {
  let nodes: BaseNode[] = [node];
  if ('children' in node) {
    for (const child of node.children) {
      nodes = nodes.concat(findAllNodes(child));
    }
  }
  return nodes;
}

// function clone(val : any) {
//   return JSON.parse(JSON.stringify(val))
// }
