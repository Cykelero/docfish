# Docfish

Not really ready for you to use it yet, sorry. Ironically, Docfish is barely documented right now.

Docfish is an API documentation builder: you describe your API in detail in XML files, and Docfish generates awesome HTML pages from that.

It was created to document Candybox, an interactive graphics JavaScript framework that's not out yet.

## Usage

After installing Docfish globally using `npm install docfish --global`, you can run it to generate HTML from a folder containing your descriptive XML files:

````bash
docfish --source=doc --destination=build
````

Your source folder must contain one or more XML files, which will each be compiled into a corresponding HTML file. The source folder should also contain a `meta.json` file, with a `name` key that will be used as a prefix for the page titles.

Supported are the `--watch` option to automatically rebuild the HTML when the source changes, and the `--check` option that will tell you if there are any broken links.

## Sample

Included in the repository is a [sample source folder](https://github.com/cykelero/docfish/tree/master/sample), which contains:

- the required `meta.json` file
- Color.xml, a description of the Color class in Candybox
- `SetMethod.xml` and `ObjectPrimitive.xml`, two files that are imported into the Color page
