// AAU IT Exit Exam Study Guide - Detailed Lessons Data
window.LESSONS_DATA = {
  // === DAY 0 (DSA + Programming Fundamentals) ===
  // Session 1: DSA
  "d0_0_0": `
    <p>Imagine your bedroom. You can store your clothes in:</p>
    <ul>
      <li><strong>A pile on the floor</strong> (fast to throw, hard to find)</li>
      <li><strong>A drawer</strong> (organized, but limited space)</li>
      <li><strong>A wardrobe with sections</strong> (structured, easy to find)</li>
    </ul>
    <p>A <strong>data structure</strong> is just a way of organizing data in a computer's memory so you can use it efficiently.</p>
    <p>Different structures suit different jobs — just like different storage suits different clothes. There is no perfect data structure for everything. Every one has trade-offs.</p>
    <div class="lesson-highlight">
      <strong>💡 Key question you always ask:</strong> What do I want to DO with this data? Search it? Sort it? Add/remove things fast?
    </div>
  `,
  "d0_0_1": `
    <p>Arrays have fixed sizes and shifting elements is slow (<code>O(n)</code>). Linked lists solve this.</p>
    <h4>What is a Linked List?</h4>
    <p>A chain of nodes, where each node contains: data and a pointer to the next node.</p>
    <pre><code>[Data|next] → [Data|next] → [Data|next] → null</code></pre>
    <ul>
      <li>No fixed size — grows as needed.</li>
      <li>Access by index: <code>O(n)</code> (must traverse from head).</li>
      <li>Insertion/deletion at head: <code>O(1)</code>.</li>
    </ul>
    <h4>Types of Linked Lists</h4>
    <ul>
      <li><strong>Singly Linked:</strong> Nodes point to next only.</li>
      <li><strong>Doubly Linked:</strong> Nodes point to next AND previous. Allows <code>O(1)</code> delete if node pointer is known, but uses 2x pointer memory.</li>
      <li><strong>Double-ended:</strong> Has pointers to both the first (head) and last (tail) nodes.</li>
    </ul>
    <div class="lesson-highlight vs">
      <strong>⚖️ Array vs Linked List Comparison</strong>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Array</th>
            <th>Linked List</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Size</strong></td>
            <td>Fixed (at compile-time)</td>
            <td>Dynamic (grows at runtime)</td>
          </tr>
          <tr>
            <td><strong>Access by index</strong></td>
            <td><code>O(1)</code></td>
            <td><code>O(n)</code></td>
          </tr>
          <tr>
            <td><strong>Insert at head</strong></td>
            <td><code>O(n)</code> (shifts items)</td>
            <td><code>O(1)</code></td>
          </tr>
          <tr>
            <td><strong>Memory overhead</strong></td>
            <td>Compact (contiguous)</td>
            <td>Extra memory for pointers</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  "d0_0_2": `
    <h4>Stack — LIFO (Last In, First Out) 📚</h4>
    <p>Think of a stack of plates. You always add and remove from the TOP.</p>
    <ul>
      <li><code>Push</code> = add to top, <code>Pop</code> = remove from top, <code>Peek</code> = view top.</li>
      <li>All operations are <code>O(1)</code>.</li>
      <li><strong>Real use:</strong> browser back button, undo history, function call/recursion management.</li>
    </ul>
  `,
  "d0_0_3": `
    <h4>Queue — FIFO (First In, First Out) 🚶‍♂️🚶‍♀️</h4>
    <p>Think of a line at a food court. First person in line gets served first.</p>
    <ul>
      <li><code>Enqueue</code> = add to rear, <code>Dequeue</code> = remove from front.</li>
      <li>All operations are <code>O(1)</code>.</li>
      <li><strong>Real use:</strong> print queues, task scheduling, Breadth-First Search (BFS).</li>
    </ul>
  `,
  "d0_0_4": `
    <div class="lesson-highlight trap">
      <strong>⚠️ TRAP: Implementing a queue on an array</strong>
      <p>Implementing a queue on a standard array without a circular index is <code>O(n)</code> because dequeueing requires shifting all remaining elements to the front. To keep it <code>O(1)</code>, we must use a circular array structure: <code>(rear + 1) % size</code>.</p>
    </div>
  `,
  "d0_0_5": `
    <h4>Binary Search Tree (BST) Rules:</h4>
    <ul>
      <li>Left child &lt; Parent</li>
      <li>Right child &gt; Parent</li>
      <li>Search is average <code>O(log n)</code> because at each step you eliminate half the tree.</li>
    </ul>
    <h4>Operations: Search, Insert, Delete</h4>
    <ul>
      <li>Average Time: <code>O(log n)</code></li>
      <li>Worst Time: <code>O(n)</code> (if tree becomes skewed/degenerate into a straight line).</li>
    </ul>
  `,
  "d0_0_6": `
    <div class="lesson-highlight vs">
      <strong>vs: BST vs AVL/Red-Black Trees</strong>
      <p>AVL and Red-Black trees are self-balancing BSTs. They enforce height constraints (AVL height diff ≤ 1) to guarantee strict <code>O(log n)</code> operations even in the worst case.</p>
    </div>
  `,
  "d0_0_7": `
    <p>A heap is a special complete binary tree (no gaps in levels) that satisfies the <strong>Heap Property</strong>:</p>
    <ul>
      <li><strong>Max-Heap:</strong> Parent node is ≥ its children. Root is always the maximum.</li>
      <li><strong>Min-Heap:</strong> Parent node is ≤ its children. Root is always the minimum.</li>
    </ul>
    <pre><code>        90 (Max-Heap Root)
       /  \\
      80   70
     / \\
    50  60</code></pre>
    <h4>Key Operations:</h4>
    <ul>
      <li>Insert / Delete: <code>O(log n)</code></li>
      <li>Peek Min/Max: <code>O(1)</code></li>
      <li>Heapify (convert array to heap): <code>O(n)</code></li>
    </ul>
    <p><strong>Real use:</strong> Priority Queues and Heap Sort.</p>
    <p><strong>Array Indexing:</strong> For node at index <code>i</code>, Parent is at <code>floor((i-1)/2)</code>, Left child at <code>2i+1</code>, Right child at <code>2i+2</code>.</p>
  `,
  "d0_0_8": `
    <div class="lesson-highlight trap">
      <strong>⚠️ TRAP: BST Traversals</strong>
      <ul>
        <li><strong>Inorder (Left-Root-Right):</strong> prints values in sorted order.</li>
        <li><strong>Preorder (Root-Left-Right):</strong> copies/clones a tree.</li>
        <li><strong>Postorder (Left-Right-Root):</strong> deletes/deallocates a tree.</li>
      </ul>
    </div>
  `,
  "d0_0_9": `
    <p>A hash table stores data using a key → value system. It converts a key into an index using a <strong>hash function</strong>, then stores the value at that index.</p>
    <ul>
      <li><strong>Insert/Search/Delete:</strong> Average <code>O(1)</code> time.</li>
      <li><strong>Downside:</strong> Fixed underlying array size; resizing is expensive. No ordering.</li>
    </ul>
    <h4>Collision Resolution - Chaining</h4>
    <p>Uses linked lists at each slot to hold colliding elements (no size limit). Worst case is <code>O(n)</code> if all keys collide.</p>
  `,
  "d0_0_10": `
    <div class="lesson-highlight vs">
      <strong>vs: Chaining vs Open Addressing</strong>
      <p>Chaining uses linked lists (infinite capacity at each index, but uses extra memory for pointers). Open addressing (linear/quadratic probing) searches for the next empty slot in the table itself. Needs <code>O(1)</code> space but has clustering issues.</p>
    </div>
  `,
  "d0_0_11": `
    <p>A graph is a set of vertices (nodes) connected by edges. Unlike trees, there are no parent-child rules; any node can connect to any other.</p>
    <div class="lesson-highlight vs">
      <strong>Matrix vs List Comparison</strong>
      <ul>
        <li><strong>Adjacency Matrix:</strong> A 2D array of size V × V.
          <ul>
            <li>Space: <code>O(V²)</code></li>
            <li>Edge check: <code>O(1)</code></li>
            <li>Best for: <strong>dense</strong> graphs (many edges).</li>
          </ul>
        </li>
        <li><strong>Adjacency List:</strong> An array of lists.
          <ul>
            <li>Space: <code>O(V + E)</code></li>
            <li>Edge check: <code>O(V)</code></li>
            <li>Best for: <strong>sparse</strong> graphs (few edges).</li>
          </ul>
        </li>
      </ul>
    </div>
  `,
  "d0_0_12": `
    <h4>1. Bubble Sort 🫧</h4>
    <p>Compare neighbors, swap if wrong order. Big values "bubble" to the end.</p>
    <ul>
      <li>Best Case: <code>O(n)</code> (with swapped flag)</li>
      <li>Average/Worst Case: <code>O(n²)</code></li>
      <li>In-place and stable. Simple but slowest.</li>
    </ul>
  `,
  "d0_0_13": `
    <h4>2. Selection Sort 🎯</h4>
    <p>Find the largest (or smallest) item, put it at the end. Repeat for remaining items.</p>
    <ul>
      <li>Best/Average/Worst Case: <code>O(n²)</code> (always loops)</li>
      <li>Fewer swaps than bubble sort: <code>O(n)</code> swaps.</li>
      <li>In-place, unstable. Minimizes swaps.</li>
    </ul>
  `,
  "d0_0_14": `
    <h4>3. Insertion Sort 🃏</h4>
    <p>Like sorting playing cards. Pick next item, insert it in the right place among already-sorted items.</p>
    <ul>
      <li>Best Case: <code>O(n)</code> (already sorted)</li>
      <li>Average/Worst Case: <code>O(n²)</code></li>
      <li>Stable, in-place, great for small or nearly sorted datasets.</li>
    </ul>
  `,
  "d0_0_15": `
    <h4>4. Merge Sort 🔀</h4>
    <p>Divide the array in half, sort each half recursively, then merge them. Uses recursion.</p>
    <ul>
      <li>Best/Average/Worst Case: <code>O(n log n)</code> (very consistent)</li>
      <li>Needs extra helper memory: <code>O(n)</code> auxiliary space.</li>
      <li>Stable, divide-and-conquer algorithm.</li>
    </ul>
  `,
  "d0_0_16": `
    <h4>5. Quick Sort ⚡</h4>
    <p>Pick a pivot value. Put smaller items left, bigger items right. Recursively sort each side.</p>
    <ul>
      <li>Best/Average Case: <code>O(n log n)</code> (usually fastest in practice)</li>
      <li>Worst Case: <code>O(n²)</code> (if pivot is always the min/max value)</li>
      <li>In-place, unstable.</li>
    </ul>
  `,
  "d0_0_17": `
    <div class="lesson-highlight trap">
      <strong>⚠️ TRAP: Stability and Memory</strong>
      <p>Quick Sort is <strong>unstable</strong> and requires <code>O(log n)</code> call stack memory. Merge Sort is <strong>stable</strong> but requires <code>O(n)</code> helper memory. Bubble/Insertion/Selection sorts require <code>O(1)</code> memory.</p>
    </div>
  `,
  "d0_0_18": `
    <div class="lesson-highlight vs">
      <strong>vs: BFS vs DFS Search</strong>
      <ul>
        <li><strong>Breadth-First Search (BFS):</strong> Uses a <strong>Queue</strong>. Explores layer-by-layer. Finds shortest path on unweighted graphs. High memory usage (stores entire frontier).</li>
        <li><strong>Depth-First Search (DFS):</strong> Uses a <strong>Stack</strong> (or recursion). Explores deep first. Lower memory usage.</li>
      </ul>
    </div>
  `,
  "d0_0_19": `
    <h4>Binary Search</h4>
    <p>Only works on <strong>sorted</strong> arrays. Goes to the middle, eliminates half, repeats. T(n) = T(n/2) + O(1) → <code>O(log n)</code>.</p>
    <div class="lesson-highlight exam">
      <strong>🎯 Exam answer:</strong> Binary search of 200 elements = log₂(200) ≈ 7.6 → 8 comparisons max.
    </div>
  `,

  // Session 2: Programming Fundamentals
  "d0_1_0": `
    <p>Primitive types are the basic data blocks built into programming languages.</p>
    <table>
      <thead>
        <tr>
          <th>Type</th>
          <th>Size</th>
          <th>Precision / Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>int</code></td>
          <td>32-bit (4 bytes)</td>
          <td>Stores integers (e.g., 5, -12)</td>
        </tr>
        <tr>
          <td><code>float</code></td>
          <td>32-bit (4 bytes)</td>
          <td>Single precision floating point (~7 decimal digits)</td>
        </tr>
        <tr>
          <td><code>double</code></td>
          <td>64-bit (8 bytes)</td>
          <td>Double precision floating point (~15 decimal digits)</td>
        </tr>
        <tr>
          <td><code>char</code></td>
          <td>8-bit (1 byte)</td>
          <td>Stores single ASCII character (e.g., 'A')</td>
        </tr>
        <tr>
          <td><code>bool</code></td>
          <td>1-bit (or 8-bit in memory)</td>
          <td>Stores <code>true</code> or <code>false</code></td>
        </tr>
      </tbody>
    </table>
  `,
  "d0_1_1": `
    <div class="lesson-highlight trap">
      <strong>⚠️ TRAP: Float Precision Errors</strong>
      <p>Floating-point numbers cannot represent some decimal values (like 0.1) exactly in binary. Therefore, <code>0.1 + 0.2 === 0.3</code> is often false. Always use a small difference threshold (epsilon) to compare floats!</p>
    </div>
  `,
  "d0_1_2": `
    <p>The <code>switch</code> statement checks a variable against multiple cases. It requires an integral expression (like <code>int</code>, <code>char</code>, or <code>enum</code>).</p>
    <div class="lesson-highlight trap">
      <strong>⚠️ TRAP: Forgetting 'break' causes Fall-through.</strong> If you omit the <code>break</code> statement at the end of a case, execution will continue into the next case regardless of whether the condition matches!
    </div>
  `,
  "d0_1_3": `
    <div class="lesson-highlight vs">
      <strong>While vs Do-While Loop</strong>
      <ul>
        <li><strong>While Loop (Pre-test):</strong> Checks the condition BEFORE executing the loop body. Runs <strong>0 or more</strong> times.</li>
        <li><strong>Do-While Loop (Post-test):</strong> Runs the loop body FIRST, then checks the condition at the end. Runs <strong>1 or more</strong> times.</li>
      </ul>
    </div>
  `,
  "d0_1_4": `
    <p>When opening files in C++, we specify the file mode:</p>
    <ul>
      <li><code>ios::in</code> (or <code>'r'</code>) — Open for reading.</li>
      <li><code>ios::out</code> (or <code>'w'</code>) — Open for writing. Overwrites/erases any existing contents.</li>
      <li><code>ios::app</code> (or <code>'a'</code>) — Append mode. Writes data to the end of the file.</li>
      <li><code>ios::binary</code> (or <code>'b'</code>) — Read/write raw binary data instead of text (e.g., images).</li>
    </ul>
  `,
  "d0_1_5": `
    <div class="lesson-highlight trap">
      <strong>⚠️ TRAP: Writing in 'w' mode</strong>
      <p>Opening a file in standard write mode (<code>ios::out</code> or <code>'w'</code>) automatically clears all existing contents instantly. Always use append mode (<code>ios::app</code>) if you want to preserve previous data.</p>
    </div>
  `,
  "d0_1_6": `
    <div class="lesson-highlight vs">
      <strong>Recursion vs Iteration Space</strong>
      <ul>
        <li><strong>Recursion:</strong> Cleaner code, but every call adds a new stack frame, creating memory overhead of <code>O(n)</code>.</li>
        <li><strong>Iteration:</strong> More efficient, uses loops with <code>O(1)</code> auxiliary space. No call stack overhead.</li>
      </ul>
    </div>
  `,
  "d0_1_7": `
    <div class="lesson-highlight vs">
      <strong>Vector vs Array Resizing</strong>
      <ul>
        <li><strong>Array:</strong> Fixed size at compile-time. Memory allocated contiguously. No resizing overhead.</li>
        <li><strong>Vector:</strong> Dynamic size. When full, it automatically grows by allocating a new array of <strong>2x size</strong>, copying existing elements over (an O(n) operation), and freeing old memory.</li>
      </ul>
    </div>
  `,
  "d0_1_8": `
    <p>Scope defines where a variable can be accessed:</p>
    <ul>
      <li><strong>Local Variables:</strong> Declared inside a block <code>{}</code> or function. Exist only on the stack frame during execution of that block.</li>
      <li><strong>Global Variables:</strong> Declared outside all functions. Exist for the entire duration of the program and are accessible from anywhere.</li>
    </ul>
  `,
  "d0_1_9": `
    <p>How arguments are passed to functions:</p>
    <ul>
      <li><strong>Pass-by-value:</strong> Copies the actual value into the function's parameter. Modifying the parameter does NOT affect the original variable.</li>
      <li><strong>Pass-by-reference (<code>&amp;</code>):</strong> Passes the memory address of the argument. Any change made to the parameter modifies the original variable directly.</li>
    </ul>
  `,
  "d0_1_10": `
    <p><strong>Dry Running</strong> is manually executing code line-by-line using pen and paper to trace variable states. It is the best way to solve loop/recursion questions in exams.</p>
  `,
  "d0_1_11": `
    <p><strong>Debugging techniques:</strong> Breakpoints (pause execution at a line) and Stepping (running line-by-line to watch variable states).</p>
  `,
  "d0_1_12": `
    <div class="lesson-highlight vs">
      <strong>Cohesion vs Coupling</strong>
      <ul>
        <li><strong>High Cohesion:</strong> Each function does exactly one logical task (Good).</li>
        <li><strong>Low Coupling:</strong> Functions/modules depend on each other as little as possible (Good).</li>
      </ul>
    </div>
  `,
  "d0_1_13": `
    <div class="lesson-highlight vs">
      <strong>Coupling vs Cohesion</strong>
      <p>Coupling is inter-module dependence (minimize it); Cohesion is intra-module focus (maximize it).</p>
    </div>
  `,
  "d0_1_14": `
    <p><strong>DRY Principle:</strong> "Don't Repeat Yourself". Abstract duplicate code blocks into reusable helper functions.</p>
  `,
  "d0_1_15": `
    <div class="lesson-highlight trap">
      <strong>⚠️ TRAP: Missing Base Case = Stack Overflow</strong>
      <p>If there is no base case, or if the recursive step doesn't reach the base case, the function calls itself infinitely, filling up the memory call stack until the program crashes.</p>
    </div>
  `
};
