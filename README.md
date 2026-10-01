# Germknödel

A passport code generator. Generates passport codes like this:

`26109Q5FB7D<<9203147X2205142<<<<<<<<<<<<<<<6`

I wrote the basic script as a terrible dev console snippet and then got almost lost in building a neat NodeJS command-line tool from it.

Currently, only German passport codes are supported. 

**Contributions for other countries and document types are welcome!**

The package name was an unconscious play of words because I still own a <i>Germ</i>an passport while living in Austria where [Germknödel](https://www.wikiwand.com/en/Germkn%C3%B6del) are hugely popular. (And delicious, btw.)

Now the name got stuck. _Sorry._ 🤷🏻‍

![](https://raw.githubusercontent.com/p3k/germknoedel/3ad71e9a421750a784a4e0d1bee41082241ed253/terminal.png)

## Installation

`npm --global install germknoedel`

## Usage

`germknoedel --help`

## Examples

`germknoedel --authority 3533 --gender female 1970-01-01 2019-12-31`

`germknoedel --serial 6068T5DH1`

`germknoedel --format json`

`germknoedel --query '*'`

## Kudos

* **A. Beck** for their excellent resources about anything regarding checksum calculation, especially the pages [Deutscher Reisepass](https://web.archive.org/web/20250123061642/http://www.pruefziffernberechnung.de/R/Reisepass-DE.shtml) and [Behördenkennzahl](https://web.archive.org/web/20250119185525/http://www.pruefziffernberechnung.de/Begleitdokumente/BKZ.shtml). The original site is gone; both links point at the last good Wayback Machine snapshot.
* **Pi’s World** for additional information about the [checksum for the latest German passport](https://pinetik.blogspot.com/2011/03/prufziffer-fur-neuen-reisepass.html).
