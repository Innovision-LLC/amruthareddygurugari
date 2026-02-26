## How to Use

Follow these steps to run the fitting workflow correctly in BraceViz PRO.

1. **Upload the torso and brace**
   - Load the **Torso** model first.
   - Load the **Brace** model next.
   - Supported file types: `.stl`, `.obj`, `.glb`, `.gltf`.

2. **Align the brace to the torso**
   - Before running any fitting tools, manually position the brace so it matches the torso as closely as possible.
   - Use **manual rotation** and other transform controls to place the brace in the correct anatomical position.
   - The brace should sit in the exact orientation and region where it is intended to fit on the torso.

3. **Run the Python fitting step**
   - Open the browser **Developer Tools** console.
   - Enter the following command:
     ```js
     runPythonFit()
     ```
   - This sends the current brace and torso geometry into the Python fitting pipeline.

4. **Review the fitting score**
   - After `runPythonFit()` finishes, review the returned score and fit result.
   - Use this score to judge whether the current alignment and fitting quality are acceptable.

5. **Run landmarks analysis**
   - After the fit is complete, click **Landmarks**.
   - This helps evaluate anatomical reference points and supports clinical inspection of the final brace position.

6. **Make manual adjustments if needed**
   - If the fit is not correct, manually rotate or reposition the brace again.
   - Re-run `runPythonFit()` until the brace alignment and score look correct.

7. **Continue with analysis or export**
   - Once the fit looks correct, continue with heatmaps, clinical review, or export features as needed.