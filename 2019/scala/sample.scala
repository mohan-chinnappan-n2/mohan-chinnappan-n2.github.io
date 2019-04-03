// looping
for (i <- 0 to 4) println(i)

// for loop returns a value
//  use of yield is awesome
val nums = for (i <- 0 to 4) yield i
println (nums)

// map
// let us double it with map function note the fact arrow =>
val dblNums = nums.map(e => e*2) 
println (dblNums)



val farmers = Vector(" ford ", "nammalvar ", "coleman")
// capitalize
println ( farmers.map(_.capitalize).map(_.trim) )
// lengths
println ( farmers.map(_.length))

// html code gen
val lis =  farmers.map(f => <li>{f}</li>)
println(lis)

// beautiful splirt for for loop!
val rec = "ramanujan, albert einstein, mohandas gandhi"
val fields = rec.split(",").map(_.trim).map(_.capitalize)
for (f <- fields) println (f)


// Tuples:  an immutable sequence of values of multiple types
val account  = ("1001", "Rachel", "Adams", 33500, "Depoist")
println (s"${account._2} ${account._3} has transaction of ${account._5} for amount ${account._4}")

val(id, fname, lname, amount, txtype) = account;
println (s"${fname} ${lname} with id: ${id} has transaction of ${txtype} for amount ${amount}")



 /*
  refs
 
  https://en.wikibooks.org/wiki/Scala
  https://alvinalexander.com/scala/
 
 */