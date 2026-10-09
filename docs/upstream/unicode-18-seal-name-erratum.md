# Draft: Unicode 18.0 erratum report (Seal character names)

Status: draft, to be submitted by the repository owner through
<https://www.unicode.org/reporting.html> (Unicode error reports). Finding CP3-07.

---

**Subject:** Unicode 18.0 core specification, chapter 18 (Seal): name prefix disagrees with Table 4-8 and DerivedName.txt

In The Unicode Standard, Version 18.0, chapter 18, the Seal section says that names for Seal
characters are derived by prefixing the code point with "SEAL CHARACTER-", for example
"SEAL CHARACTER-3D000":
<https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-18/>

Table 4-8, Name Derivation Rule Prefix Strings, in chapter 4 gives "SMALL SEAL CHARACTER-" for
3D000..3FC3F:
<https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-4/>

The UCD agrees with Table 4-8. `extracted/DerivedName.txt` 18.0.0 lists
`3D000..3FC3F ; SMALL SEAL CHARACTER-*`.

The chapter 18 text appears to need "SMALL SEAL CHARACTER-" (and "SMALL SEAL CHARACTER-3D000"
in its example).

Found while implementing Unicode 18 support in Unicode Explorer
(<https://github.com/tyohDeveloper/Unicode-Explorer>). A unit test there checks all 172,808
derived names against DerivedName.txt.
