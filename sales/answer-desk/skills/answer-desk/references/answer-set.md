# Answer a question set

The operator hands you questions: pasted into chat, forwarded, or in a file
in the workspace.

## 1. Split and number

Split the input into individual questions and number them. A question with
two parts becomes two questions, because they usually have different answers
and one of them is usually a gap.

Keep the original wording. You are producing something that gets pasted back
into somebody else's form, and a reworded question is hard to line up.

If there are more than about forty, say how many there are and confirm before
you start, so the operator can split the work.

## 2. Answer each one against the corpus only

Read `references/corpus.md` for how to search and how to cite.

For each question, exactly one of three states:

- **ANSWERED**, with the answer and the `file:line` behind it. If two lines
  support it, cite both.
- **GAP**, with the specific fact you would need. Not "no information about
  security" but "whether a Type II audit has completed, the report date, and
  the auditing firm". The specificity is what makes the next step possible.
- **CONFLICT**, when the corpus says something adjacent that contradicts an
  assumption inside the question. Answer what was asked, cite the line, and
  flag the mismatch on its own line.

The three tests, applied to every answer before you write it:

1. Can you point at the line? If not, it is a `GAP`.
2. Does the line actually say this, or does it say something you reasoned
   from? Reasoning across facts is not citation. `GAP`.
3. Would the operator be comfortable if a customer's lawyer read the line and
   the answer side by side? If not, `GAP`, and say why.

## 3. Hand it over

Deliver the numbered set in the flat format from `SKILL.md`: plain text, no
markdown, no code fence around it, lines under about 90 characters. It is going
to be pasted into a form. Then one line of summary, in this shape and nothing
more elaborate:

> 31 questions. 22 answered, 8 gaps, 1 conflict.

Every question is in exactly one state, so the three counts add up to the
number of questions. Add them before you send the line. A summary that does
not reconcile is the first thing a careful reader checks, and getting it wrong
undermines every citation above it.

Write the whole set to `additional_context/answer-sets/<YYYY-MM-DD>-<who-asked>.md`, including
the gaps. The weekly report counts repeats out of these files, so a set that
is not written down is a question that gets asked forever.

Append each gap to `additional_context/gaps.md` with the date, who asked, and the question.

## 4. Go straight into closing the gaps

Do not stop here and do not wait to be asked. Move immediately to
`references/close-the-gap.md` while the questionnaire is still in front of
them. That is the whole point of the desk.

If there are no gaps, say so plainly and stop. It happens more as the corpus
grows, and it is worth naming when it does.
