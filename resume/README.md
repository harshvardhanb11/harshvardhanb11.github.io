# Resume

`resume.pdf` is compiled from `resume.tex` with pdfLaTeX, using the LaTeX format and wording supplied by Harshvardhan Birla.

- Preserved the supplied experience, three project descriptions, counts, measurements, skills, education, and achievements.
- Added Distributed Compute Orchestration Platform from the earlier supplied resume in the same project format.
- Fixed pasted LaTeX escape characters and spacing, corrected the LinkedIn/GitHub URL escaping, and removed the duplicated Data & Infrastructure skill row.
- Uses the supplied 10 pt article template with Charter text; the template's `\small` project bullets are 9 pt. US Letter, one page.

To edit and rebuild in a standard TeX Live installation:

```sh
pdflatex -interaction=nonstopmode -halt-on-error resume.tex
pdflatex -interaction=nonstopmode -halt-on-error resume.tex
```

Alternatively, upload `resume.tex` to Overleaf and choose pdfLaTeX.
