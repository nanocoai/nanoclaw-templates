# Reproducibility checklist

Score a `bug` report against these four. All four must be present for
**sufficient**. Name the missing ones individually.

## 1. Steps

Present when there is a command, a code snippet, a request, or a numbered
sequence a maintainer could follow. Absent when the reporter only describes the
outcome ("it crashes on startup").

## 2. Actual result

Present when there is an error message, stack trace, exit code, wrong output, or
a precise description of the wrong behaviour. Absent when the report says only
"it fails" or "nothing happens".

A screenshot counts. Do not ask for text if a screenshot already shows the error,
unless the text is genuinely unreadable.

## 3. Expected result

Present when the reporter states what should have happened, or when it is
unmistakable from the steps (a documented command that errors out). Absent when
the correct behaviour is a matter of opinion and they have not said which they want.

## 4. Version

Present when there is a release number, tag, commit SHA, or package version of
**this project**. Absent when only the language runtime or OS version is given.

## What you never do

- Never claim you reproduced it. You cannot run their code.
- Never guess the version from context.
- Never mark a report insufficient purely because it is short. Four sentences
  containing all four elements is a good report.
- Never ask for information already present higher up in the thread.
