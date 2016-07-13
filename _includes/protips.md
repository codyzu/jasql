# Ids and Indexes

By default, jasql supports a single indexed field named `_id`.
This can be any string up to 255 characters.
If you don't define this id, jasql will generate a nice random one for you.

However, **don't be limited by random ids!**

:bulb: Prefix your ids with the type of the document, i.e. `users/Cody`. This makes retrieving all documents of a given type super easy `jasql.list({id:'users/%'})`.

:bulb: Need documents sorted by date? Try using `new Date().toJSON()` in the id. When you list them, they will be sorted chronologically!

# Motivation (why not mongodb?)

Why not just used mongodb?

Sometimes client and/or infrastructure requirements simple don't allow us to choose any database we want.
Enterprises often have DB Admins, contracts, infrastructure, and proven expertise in one of the big database names.
Until now, node.js support for the big relational databases was very limited.
That time is over...
**jasql lets you continue focusing on functionality and keeps the dirty SQL details out of your way!**
