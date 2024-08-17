import { smartSortNodes } from './smart-sort-nodes/utilities/smart-sort-nodes.js'

export default function () {

  // let node : FrameNode = figma.currentPage.selection[0] as FrameNode; //.findAll(n=> name === "About this file");
  // const nodes = clone(node.children);//node.children.slice();
  // //console.log(nodes)
  // smartSortNodes(nodes);
  // //console.log(nodes)
  // //node.children = nodes;
  // node.children.map((nObj) => {
  //     nObj.remove(); //remove node and all its children
  // });

  // nodes.forEach((element : any) => {
  //   node.appendChild(element);
  // });

  // figma.closePlugin('Hello, World!');
  
    // const selection = figma.currentPage.selection;
    // if (selection.length !== 1 || selection[0].type !== 'FRAME') {
    //   figma.ui.postMessage({ type: 'error', message: 'Please select a single frame.' });
    //   return;
    // }
    // const frame = selection[0] as FrameNode;

    // console.log(frame.children[0].name)
    // console.log(frame.children.length)
    
    // for(var i = 0; i < frame.children.length; i++)
    //   console.log(i + " " + frame.children[i].name)

    // frame.insertChild(0, frame.children[4]);
    
    // //const layerNames = getLayerNames(frame);
  
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
    for (const node of nodesToUpdate) {
      if (!doesNodeExist(node.id)) {
        continue;
      }
      
      if (node.type === 'TEXT') {
        //console.log((node as TextNode).fontName);
        figma.loadFontAsync((node as TextNode).fontName as FontName)
        .then(()=> { (node as TextNode).textAlignHorizontal = 'RIGHT'; });
        
        //(node as TextNode).textAlignHorizontal = 'RIGHT';
      } else if (node.type === 'FRAME' || node.type === 'GROUP') {
        // Adjust alignment properties of frames and groups if needed
        // For example, you might flip the children horizontally
        flipChildrenHorizontally(node as FrameNode | GroupNode);
      }
    }

    figma.closePlugin();

}

// Detach instances from the nodes array
function detachInstances(nodes: BaseNode[]) {
  for (const node of nodes) {
    if (node.type === 'INSTANCE') {
      node.detachInstance();
      // const detachedInstance = node.detachInstance();
      // if (detachedInstance) {
      //   nodes.push(detachedInstance);
      //   nodes.push(...detachedInstance.children); // Add children of detached instance

      // }
    }
  }
}
// function clone(val : any) {
//   return JSON.parse(JSON.stringify(val))
// }

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

// Function to flip children of a frame or group horizontally
function flipChildrenHorizontally(node: FrameNode | GroupNode) {
  ///for (const child of node.children) {
    // //console.log(child.name)
    // // if ('layoutMode' in child &&
    // // (child.layoutMode === 'HORIZONTAL' || child.layoutMode === 'VERTICAL')) {
    // //   continue; // Skip instances
    // // }
    // /// Error: in set_x: This property cannot be overridden in an instance
    // try {
    // child.x = parentWidth - child.x - child.width;
    // } catch {

    // }
    // if (child.type === 'FRAME' || child.type === 'GROUP') {
    //   flipChildrenHorizontally(child as FrameNode | GroupNode);
    // }

  // Create a copy of the children array to safely modify the original children during iteration
  // const children = [];
  // if (!doesNodeExist(node.id)) {
  //   return;
  // }
  // const parentWidth = node.width;

  // for (const child of node.children) {
  //   try {
  //     if (child.type === 'INSTANCE') {
  //       // Detach instance to manipulate its properties
  //       const detachedInstance = child.detachInstance();
  //       if (detachedInstance) {
  //         detachedInstance.x = parentWidth - detachedInstance.x - detachedInstance.width;
  //         // Recursively flip children of the detached instance
  //         if ('children' in detachedInstance) {
  //           flipChildrenHorizontally(detachedInstance as FrameNode | GroupNode);
  //         }
  //       }
  //     } else {
  //       child.x = parentWidth - child.x - child.width;
  //       // Recursively flip children of non-instance nodes
  //       if ('children' in child) {
  //         flipChildrenHorizontally(child as FrameNode | GroupNode);
  //       }
  //     }
  //   } catch (error) {
  //     console.error(`Error processing node with id "${child.id}": ${error}`);
  //   }
  // }

  const parentWidth = node.width;

  for (const child of node.children) {
    child.x = parentWidth - child.x - child.width;
    // Recursively flip children of non-instance nodes
    if ('children' in child) {
      flipChildrenHorizontally(child as FrameNode | GroupNode);
    }
  }
  
}

function doesNodeExist(nodeId: string): boolean {
  const node = figma.getNodeById(nodeId);
  return !!node; // Returns true if node exists, false otherwise
}


// function isNodePartOfInstance(node: SceneNode): boolean {
//   let currentNode: SceneNode | null = node;
//   while (currentNode) {
//     if (currentNode.type === 'INSTANCE') {
//       return true;
//     }
//     currentNode = currentNode.parent as SceneNode | null;
//   }
//   return false;
// }