// "use client";

// import { Card } from "@/components/card";
// import { Button } from "@/components/button";
// import { Save, GripVertical } from "lucide-react";

// import Navbar from "../../components/navbar";
// import {
// ,
//   useVoteOnProposals,
// } from "../../hooks/useSnapshot";
// import { useEffect, useState, useRef } from "react";
// import { DndProvider, useDrag, useDrop } from "react-dnd";
// import { HTML5Backend } from "react-dnd-html5-backend";
// import { Candidate } from "@/types/election";

// // Define drag item type d
// const ItemTypes = {
//   CANDIDATE: "candidate",
// };

// // Draggable candidate component
// const DraggableCandidateItem = ({
//   candidate,
//   index,
//   moveCandidate,
// }: {
//   candidate: Candidate;
//   index: number;
//   moveCandidate: (dragIndex: number, hoverIndex: number) => void;
// }) => {
//   const ref = useRef<HTMLLIElement>(null);

//   // Setup drag functionality
//   const [{ isDragging }, drag] = useDrag({
//     type: ItemTypes.CANDIDATE,
//     item: { index },
//     collect: (monitor) => ({
//       isDragging: monitor.isDragging(),
//     }),
//   });

//   const [, drop] = useDrop({
//     accept: ItemTypes.CANDIDATE,
//     hover: (item, monitor) => {
//       if (!ref.current) return;

//       const dragIndex = (item as { index: number }).index;
//       const hoverIndex = index;

//       // Don't replace items with themselves
//       if (dragIndex === hoverIndex) return;

//       // Get rectangle on screen
//       const hoverBoundingRect = ref.current?.getBoundingClientRect();

//       // Get vertical middle
//       const hoverMiddleY =
//         (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

//       // Get mouse position
//       const clientOffset = monitor.getClientOffset();
//       if (!clientOffset) return;

//       // Get pixels to the top
//       const hoverClientY = clientOffset.y - hoverBoundingRect.top;

//       // Only perform the move when the mouse has crossed half of the items height
//       // When dragging downwards, only move when the cursor is below 50%
//       // When dragging upwards, only move when the cursor is above 50%

//       // Dragging downwards
//       if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;

//       // Dragging upwards
//       if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

//       // Perform the actual move
//       moveCandidate(dragIndex, hoverIndex);

//       // Update drag source index
//       (item as { index: number }).index = hoverIndex;
//     },
//   });

//   // Connect drag and drop refs
//   drag(drop(ref));

//   return (
//     <li
//       ref={ref}
//       className={`p-4 flex items-center ${
//         isDragging ? "opacity-50 bg-gray-800" : ""
//       }`}
//       style={{ cursor: "move" }}
//     >
//       <div className="flex items-center mr-2 text-gray-400">
//         <GripVertical size={20} />
//       </div>

//       <div className="flex-1">
//         <div className="flex items-center">
//           <span className="font-medium text-gray-100 mr-2">{index + 1}.</span>
//           <span className="font-medium text-gray-100">{candidate.name}</span>
//         </div>
//       </div>
//     </li>
//   );
// };

// export default function Votes() {
//   const { proposal, isLoading, isError, isFetching } = useGetProposals();
//   const { voteFunc } = useVoteOnProposals();

//   const [orderedItems, setOrderedItems] = useState<Candidate[]>([]);

//   useEffect(() => {
//     if (proposal)
//       setOrderedItems(() => [
//         ...proposal.raking,
//         // {
//         //   name: "None of the below",
//         //   basicBudget: 0,
//         //   score: 0,
//         //   extendedBudget: 0,
//         //   streamDuration: "Not Eligible",
//         //   id: proposal.raking.length + 1,
//         // },
//       ]);
//   }, [proposal]);

//   async function submitVote() {
//     const choices = orderedItems.map(({ id }) => id);
//     await voteFunc(choices);
//   }

//   // Function to move candidate based on drag and drop
//   const moveCandidate = (dragIndex: number, hoverIndex: number) => {
//     const newItems = [...orderedItems];
//     const draggedItem = newItems[dragIndex];

//     // Remove the dragged item
//     newItems.splice(dragIndex, 1);
//     // Insert it at the new position
//     newItems.splice(hoverIndex, 0, draggedItem);

//     setOrderedItems(newItems);
//   };

//   if (isLoading) return <div>Loading...</div>;
//   if (isError || !proposal) return <div>Error</div>;
//   if (isFetching) return <div>Fetching...</div>;

//   return (
//     <div className="min-h-screen bg-gray-900">
//       <Navbar />

//       <main className="container mx-auto px-4 py-8">
//         <div className="max-w-3xl mx-auto">
//           <div className="mb-8">
//             <h2 className="text-2xl font-bold mb-2 text-gray-100">
//               Rank Your Preferences
//             </h2>
//             <p className="text-gray-400">
//               Drag candidates up or down to rank them in your preferred order.
//               Any candidates below &quot;None of the below&quot; will not be
//               counted.
//             </p>
//           </div>

//           <div className="bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
//             <div className="p-4 bg-blue-900/50 border-b border-blue-800">
//               <h3 className="font-medium text-blue-100">Instructions</h3>
//               <p className="text-sm text-blue-200 mt-1">
//                 Drag and drop candidates to reorder them. Your most preferred
//                 candidate should be at the top. Any candidates below &quot;None
//                 of the below&quot; will not be counted in your vote.
//               </p>
//             </div>

//             <DndProvider backend={HTML5Backend}>
//               <ul className="divide-y divide-gray-700">
//                 {orderedItems.map((candidate, index) => (
//                   <DraggableCandidateItem
//                     key={candidate.id}
//                     candidate={candidate}
//                     index={index}
//                     moveCandidate={moveCandidate}
//                   />
//                 ))}
//               </ul>
//             </DndProvider>
//           </div>

//           <div className="flex justify-end">
//             <Button onClick={submitVote} className="flex items-center gap-2">
//               <Save size={16} />
//               Submit Vote
//             </Button>
//           </div>

//           <Card className="mt-8 p-4 bg-yellow-900/50 border-yellow-800">
//             <h3 className="font-medium text-yellow-100">Important Note</h3>
//             <p className="text-sm text-yellow-200 mt-1">
//               Once submitted, your vote cannot be changed. Please review your
//               ranking carefully before submitting.
//             </p>
//           </Card>
//         </div>
//       </main>
//     </div>
//   );
// }
